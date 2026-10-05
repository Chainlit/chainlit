import asyncio
from urllib.parse import parse_qs

import pytest
from mcp.client.auth import OAuthClientProvider
from mcp.shared.auth import (
    OAuthClientInformationFull,
    OAuthClientMetadata,
    OAuthToken,
)
from pydantic import AnyUrl, ValidationError

from chainlit.config import McpFeature, McpServerOAuth, StreamableHttpMcpServer
from chainlit.mcp import McpDestinationError, _destination_on_origin
from chainlit.mcp_oauth import (
    McpAuthorizationError,
    McpOAuthTokenStore,
    PendingAuthorizations,
    ScopedTokenStorage,
    build_oauth_provider,
    canonical_server_key,
    extract_state,
)


@pytest.fixture(autouse=True)
def _fresh_oauth_state():
    """The token store and pending map are process-wide singletons that the
    app itself uses; start and leave each test with both empty."""
    from chainlit.mcp_oauth import pending_authorizations, token_store

    def clear() -> None:
        pending_authorizations._pending.clear()
        token_store._tokens.clear()
        token_store._clients.clear()

    clear()
    yield
    clear()


def make_token(access_token: str) -> OAuthToken:
    return OAuthToken(access_token=access_token, token_type="Bearer")


def make_client_info(client_id: str) -> OAuthClientInformationFull:
    return OAuthClientInformationFull(
        client_id=client_id,
        redirect_uris=[AnyUrl("https://app.example.com/mcp/oauth/callback")],
    )


class TestCanonicalServerKey:
    """The key decides which token is reused, so equivalence must be exact."""

    @pytest.mark.parametrize(
        ("a", "b"),
        [
            ("https://mcp.example.com/sse", "https://MCP.Example.com/sse"),
            ("https://mcp.example.com/sse", "HTTPS://mcp.example.com/sse"),
            ("https://mcp.example.com/sse", "https://mcp.example.com:443/sse"),
            ("http://mcp.example.com/sse", "http://mcp.example.com:80/sse"),
            ("https://mcp.example.com/sse", "https://mcp.example.com/sse#frag"),
            ("https://mcp.example.com", "https://mcp.example.com/"),
            ("https://[::ABCD]/mcp", "https://[::abcd]:443/mcp"),
        ],
    )
    def test_equivalent_urls_share_a_key(self, a, b):
        assert canonical_server_key(a) == canonical_server_key(b)

    @pytest.mark.parametrize(
        ("a", "b"),
        [
            # Two MCP servers on one host must not share a token.
            ("https://example.com/jira", "https://example.com/confluence"),
            # A non-default port is a different endpoint.
            ("https://example.com/sse", "https://example.com:8443/sse"),
            # http and https are different origins.
            ("http://example.com/sse", "https://example.com/sse"),
            ("https://a.example.com/sse", "https://b.example.com/sse"),
            # Kept as the SDK keeps them in the RFC 8707 resource URL: a
            # trailing slash or a query can select another server or tenant.
            ("https://example.com/mcp", "https://example.com/mcp/"),
            ("https://example.com/mcp?tenant=a", "https://example.com/mcp?tenant=b"),
            ("https://example.com/mcp", "https://example.com/mcp?tenant=a"),
            # A port must not run into an IPv6 address.
            ("https://[::1]:8443/mcp", "https://[::1:8443]/mcp"),
        ],
    )
    def test_distinct_servers_get_distinct_keys(self, a, b):
        assert canonical_server_key(a) != canonical_server_key(b)

    def test_credentials_are_not_kept_in_the_key(self):
        key = canonical_server_key("https://user:pw@example.com/sse")
        assert "user" not in key
        assert "pw" not in key
        assert key == canonical_server_key("https://example.com/sse")


class TestScopedTokenStorageProtocol:
    def test_is_accepted_by_the_sdk_oauth_provider(self):
        """The SDK drives the flow, so the storage has to satisfy it for real.

        ``TokenStorage`` is not ``@runtime_checkable``, so construct the provider
        that consumes it instead of asserting ``isinstance``.
        """
        scoped = McpOAuthTokenStore().scoped("alice", "https://example.com/sse")

        provider = OAuthClientProvider(
            server_url="https://example.com/sse",
            client_metadata=OAuthClientMetadata(
                client_name="Chainlit",
                redirect_uris=["https://app.example.com/mcp/oauth/callback"],
                grant_types=["authorization_code", "refresh_token"],
                response_types=["code"],
            ),
            storage=scoped,
        )

        assert provider.context.storage is scoped

    async def test_round_trips_tokens_and_client_info(self):
        scoped = McpOAuthTokenStore().scoped("alice", "https://example.com/sse")

        assert await scoped.get_tokens() is None
        assert await scoped.get_client_info() is None

        await scoped.set_tokens(make_token("tok-1"))
        await scoped.set_client_info(make_client_info("client-1"))

        stored = await scoped.get_tokens()
        assert stored is not None
        assert stored.access_token == "tok-1"
        client = await scoped.get_client_info()
        assert client is not None
        assert client.client_id == "client-1"


class TestIsolation:
    """The properties that stop one user's access leaking to another."""

    async def test_a_token_is_not_readable_by_another_user(self):
        store = McpOAuthTokenStore()
        server = "https://jira.example.com/mcp"

        await store.scoped("alice", server).set_tokens(make_token("alice-token"))

        # Bob reconnects to the same server and must start unauthenticated.
        assert await store.scoped("bob", server).get_tokens() is None

    async def test_a_token_is_not_sent_to_a_different_server(self):
        store = McpOAuthTokenStore()

        await store.scoped("alice", "https://jira.example.com/mcp").set_tokens(
            make_token("jira-token")
        )

        # Same user, different server: the Jira token must not be offered.
        other = store.scoped("alice", "https://evil.example.com/mcp")
        assert await other.get_tokens() is None

    async def test_client_registration_is_also_scoped(self):
        store = McpOAuthTokenStore()
        server = "https://jira.example.com/mcp"

        await store.scoped("alice", server).set_client_info(make_client_info("alice-c"))

        assert await store.scoped("bob", server).get_client_info() is None

    async def test_equivalent_urls_reuse_the_same_token(self):
        store = McpOAuthTokenStore()
        await store.scoped("alice", "https://Jira.Example.com/mcp").set_tokens(
            make_token("jira-token")
        )

        reconnect = store.scoped("alice", "https://jira.example.com:443/mcp")
        stored = await reconnect.get_tokens()
        assert stored is not None
        assert stored.access_token == "jira-token"

    def test_a_scope_requires_a_user_identifier(self):
        store = McpOAuthTokenStore()
        with pytest.raises(ValueError, match="user identifier"):
            store.scoped("", "https://example.com/mcp")


class TestForgetting:
    async def test_forget_user_drops_every_server_for_that_user_only(self):
        store = McpOAuthTokenStore()
        jira = "https://jira.example.com/mcp"
        confluence = "https://confluence.example.com/mcp"

        await store.scoped("alice", jira).set_tokens(make_token("a-jira"))
        await store.scoped("alice", confluence).set_tokens(make_token("a-conf"))
        await store.scoped("bob", jira).set_tokens(make_token("b-jira"))

        store.forget_user("alice")

        assert await store.scoped("alice", jira).get_tokens() is None
        assert await store.scoped("alice", confluence).get_tokens() is None
        bob = await store.scoped("bob", jira).get_tokens()
        assert bob is not None
        assert bob.access_token == "b-jira"

    async def test_forget_server_drops_one_server_only(self):
        store = McpOAuthTokenStore()
        jira = "https://jira.example.com/mcp"
        confluence = "https://confluence.example.com/mcp"

        await store.scoped("alice", jira).set_tokens(make_token("a-jira"))
        await store.scoped("alice", confluence).set_tokens(make_token("a-conf"))

        store.forget_server("alice", "https://JIRA.example.com:443/mcp")

        assert await store.scoped("alice", jira).get_tokens() is None
        kept = await store.scoped("alice", confluence).get_tokens()
        assert kept is not None
        assert kept.access_token == "a-conf"

    async def test_forgetting_an_unknown_entry_is_a_no_op(self):
        store = McpOAuthTokenStore()
        store.forget_user("nobody")
        store.forget_server("nobody", "https://example.com/mcp")


class TestPendingAuthorizations:
    """The callback route is shared, so `state` must carry the user with it."""

    async def test_the_originating_user_completes_the_flow(self):
        pending = PendingAuthorizations()
        state = "sdk-state-1"
        flow = pending.register(state, "alice", "https://jira.example.com/mcp")

        resolved = pending.resolve(state, "alice", "auth-code")

        assert resolved.user_identifier == "alice"
        assert resolved.server_key == "https://jira.example.com/mcp"
        assert await flow.wait() == ("auth-code", state)

    async def test_another_user_cannot_complete_someone_elses_flow(self):
        pending = PendingAuthorizations()
        state = "sdk-state-1"
        flow = pending.register(state, "alice", "https://jira.example.com/mcp")

        with pytest.raises(PermissionError):
            pending.resolve(state, "mallory", "stolen-code")

        # Alice's flow survives so she can still finish it.
        assert flow.result is None
        pending.resolve(state, "alice", "auth-code")
        assert await flow.wait() == ("auth-code", state)

    async def test_a_state_cannot_be_replayed(self):
        pending = PendingAuthorizations()
        state = "sdk-state-1"
        pending.register(state, "alice", "https://jira.example.com/mcp")
        pending.resolve(state, "alice", "auth-code")

        with pytest.raises(KeyError):
            pending.resolve(state, "alice", "auth-code")

    def test_an_unknown_state_is_rejected(self):
        pending = PendingAuthorizations()
        with pytest.raises(KeyError):
            pending.resolve("never-issued", "alice", "code")

    async def test_states_are_unique_per_flow(self):
        pending = PendingAuthorizations()
        pending.register("state-a", "alice", "https://jira.example.com/mcp")
        pending.register("state-b", "alice", "https://jira.example.com/mcp")
        assert len(pending) == 2

    async def test_expired_flows_are_dropped(self):
        pending = PendingAuthorizations(ttl_seconds=0)
        state = "sdk-state-1"
        flow = pending.register(state, "alice", "https://jira.example.com/mcp")

        with pytest.raises(KeyError):
            pending.resolve(state, "alice", "auth-code")
        assert len(pending) == 0
        assert flow.cancelled

    async def test_cancel_releases_the_waiter(self):
        pending = PendingAuthorizations()
        state = "sdk-state-1"
        flow = pending.register(state, "alice", "https://jira.example.com/mcp")

        pending.cancel(state)

        assert flow.cancelled
        assert len(pending) == 0

    def test_a_flow_requires_a_user_identifier(self):
        pending = PendingAuthorizations()
        with pytest.raises(ValueError, match="user identifier"):
            pending.register("s", "", "https://example.com/mcp")

    def test_a_flow_requires_a_state(self):
        pending = PendingAuthorizations()
        with pytest.raises(ValueError, match="state"):
            pending.register("", "alice", "https://example.com/mcp")


class TestScopeAccessors:
    def test_exposes_the_scope_it_is_bound_to(self):
        scoped = McpOAuthTokenStore().scoped("alice", "https://Example.com/mcp/")
        assert isinstance(scoped, ScopedTokenStorage)
        assert scoped.user_identifier == "alice"
        assert scoped.server_key == "https://example.com/mcp/"


class TestMcpOAuthCallbackRoute:
    """The callback is reachable by any logged-in user, so it must check scope."""

    @pytest.fixture
    def client_and_user(self):
        from fastapi.testclient import TestClient

        from chainlit.auth import get_current_user
        from chainlit.server import app
        from chainlit.user import User

        def _as(identifier):
            app.dependency_overrides[get_current_user] = lambda: User(
                identifier=identifier
            )
            return TestClient(app)

        yield _as
        app.dependency_overrides.pop(get_current_user, None)

    def test_the_owner_completes_the_flow(self, client_and_user):
        from chainlit.mcp_oauth import pending_authorizations

        state = "sdk-owner-state"
        pending_authorizations.register(state, "alice", "https://jira.example.com/mcp")
        client = client_and_user("alice")

        res = client.get(f"/mcp/oauth/callback?code=abc&state={state}")

        assert res.status_code == 200

    def test_another_user_is_refused(self, client_and_user):
        from chainlit.mcp_oauth import pending_authorizations

        state = "sdk-mallory-state"
        flow = pending_authorizations.register(
            state, "alice", "https://jira.example.com/mcp"
        )
        client = client_and_user("mallory")

        res = client.get(f"/mcp/oauth/callback?code=stolen&state={state}")

        assert res.status_code == 403
        # Alice's flow is untouched, so she can still complete it.
        assert flow.result is None

    def test_an_unknown_state_is_rejected(self, client_and_user):
        client = client_and_user("alice")
        res = client.get("/mcp/oauth/callback?code=abc&state=never-issued")
        assert res.status_code == 400

    def test_a_provider_error_is_surfaced(self, client_and_user):
        client = client_and_user("alice")
        res = client.get("/mcp/oauth/callback?error=access_denied")
        assert res.status_code == 400

    def test_missing_code_is_rejected(self, client_and_user):
        """Use a real state so the 400 can only come from the missing code."""
        from chainlit.mcp_oauth import pending_authorizations

        state = "sdk-missing-code-state"
        flow = pending_authorizations.register(
            state, "alice", "https://jira.example.com/mcp"
        )
        client = client_and_user("alice")

        res = client.get(f"/mcp/oauth/callback?state={state}")

        assert res.status_code == 400
        assert res.json()["detail"] == "Missing code or state"
        # The waiting connection is released rather than left hanging.
        assert flow.cancelled

    def test_a_provider_error_abandons_the_flow(self, client_and_user):
        from chainlit.mcp_oauth import pending_authorizations

        state = "sdk-error-state"
        flow = pending_authorizations.register(
            state, "alice", "https://jira.example.com/mcp"
        )
        client = client_and_user("alice")

        res = client.get(f"/mcp/oauth/callback?error=access_denied&state={state}")

        assert res.status_code == 400
        assert flow.cancelled

    def test_an_error_cannot_abandon_someone_elses_flow(self, client_and_user):
        from chainlit.mcp_oauth import pending_authorizations

        state = "sdk-victim-state"
        flow = pending_authorizations.register(
            state, "alice", "https://jira.example.com/mcp"
        )
        client = client_and_user("mallory")

        res = client.get(f"/mcp/oauth/callback?error=access_denied&state={state}")

        assert res.status_code == 400
        # Alice's connection is untouched.
        assert not flow.cancelled


class TestProviderStateCorrelation:
    """The SDK mints the state, so the pending map must be keyed on that one.

    Registering a Chainlit-generated state would key the map on a value the
    browser never echoes back, and every callback would 404 the flow.
    """

    def test_extract_state_reads_the_url(self):
        assert (
            extract_state("https://as.example.com/authorize?client_id=x&state=s1")
            == "s1"
        )
        assert extract_state("https://as.example.com/authorize?client_id=x") is None

    async def test_the_flow_is_registered_under_the_sdk_state(self):
        """Drive the provider's redirect handler and check the key it used."""
        from chainlit.mcp_oauth import pending_authorizations

        seen: list[str] = []

        async def on_redirect(url: str) -> None:
            seen.append(url)

        provider = build_oauth_provider(
            user_identifier="alice",
            server_url="https://jira.example.com/mcp",
            redirect_uri="https://app.example.com/mcp/oauth/callback",
            on_redirect=on_redirect,
        )

        sdk_url = "https://as.example.com/authorize?client_id=c&state=sdk-generated"
        await provider.context.redirect_handler(sdk_url)

        assert seen == [sdk_url]
        # The callback route looks the flow up by the state in that URL.
        resolved = pending_authorizations.resolve("sdk-generated", "alice", "code-1")
        assert resolved.user_identifier == "alice"

    async def test_the_callback_handler_returns_the_sdk_state(self):
        """The SDK compares the returned state with compare_digest."""
        from chainlit.mcp_oauth import pending_authorizations

        async def on_redirect(url: str) -> None:
            return None

        provider = build_oauth_provider(
            user_identifier="alice",
            server_url="https://jira.example.com/mcp",
            redirect_uri="https://app.example.com/mcp/oauth/callback",
            on_redirect=on_redirect,
        )

        await provider.context.redirect_handler(
            "https://as.example.com/authorize?state=sdk-echo"
        )
        pending_authorizations.resolve("sdk-echo", "alice", "the-code")

        assert await provider.context.callback_handler() == ("the-code", "sdk-echo")

    async def test_the_sdk_consumes_what_the_callback_returns(self):
        """Run the SDK's own authorization step against this provider, not
        only our half of it: the SDK has to unpack the callback's result, match
        the state it minted, and carry the code into the token request."""
        from chainlit.mcp_oauth import pending_authorizations

        redirects: list[str] = []
        redirected = asyncio.Event()

        async def on_redirect(url: str) -> None:
            redirects.append(url)
            redirected.set()

        redirect_uri = "https://app.example.com/mcp/oauth/callback"
        provider = build_oauth_provider(
            user_identifier="alice",
            server_url="https://jira.example.com/mcp",
            redirect_uri=redirect_uri,
            on_redirect=on_redirect,
        )
        provider.context.client_info = OAuthClientInformationFull(
            client_id="chainlit-client", redirect_uris=[AnyUrl(redirect_uri)]
        )

        authorizing = asyncio.create_task(provider._perform_authorization())
        await asyncio.wait_for(redirected.wait(), timeout=5)
        state = extract_state(redirects[0])
        assert state is not None
        pending_authorizations.resolve(state, "alice", "the-code")

        token_request = await asyncio.wait_for(authorizing, timeout=5)

        assert token_request.method == "POST"
        body = parse_qs(token_request.content.decode())
        assert body["grant_type"] == ["authorization_code"]
        assert body["code"] == ["the-code"]

    async def test_a_url_without_state_is_refused(self):
        async def on_redirect(url: str) -> None:
            return None

        provider = build_oauth_provider(
            user_identifier="alice",
            server_url="https://jira.example.com/mcp",
            redirect_uri="https://app.example.com/mcp/oauth/callback",
            on_redirect=on_redirect,
        )

        with pytest.raises(ValueError, match="state"):
            await provider.context.redirect_handler(
                "https://as.example.com/authorize?client_id=c"
            )


class TestFailingFast:
    """A flow that ends without a code must say why, and say it promptly."""

    async def test_an_abandoned_flow_raises_its_reason_not_a_cancellation(self):
        pending = PendingAuthorizations()
        flow = pending.register("abandoned", "alice", "https://jira.example.com/mcp")
        waiter = flow.wait()

        pending.abandon("abandoned", "alice", reason="access_denied")

        with pytest.raises(McpAuthorizationError, match="access_denied"):
            await waiter

    async def test_an_expired_flow_raises_too(self):
        pending = PendingAuthorizations(ttl_seconds=0)
        flow = pending.register("expired", "alice", "https://jira.example.com/mcp")

        assert len(pending) == 0  # expiry is applied on access

        with pytest.raises(McpAuthorizationError, match="expired"):
            await flow.wait()

    async def test_the_provider_reports_a_refused_authorization(self):
        from chainlit.mcp_oauth import pending_authorizations

        failures: list[McpAuthorizationError] = []

        async def on_redirect(url: str) -> None:
            return None

        provider = build_oauth_provider(
            user_identifier="alice",
            server_url="https://jira.example.com/mcp",
            redirect_uri="https://app.example.com/mcp/oauth/callback",
            on_redirect=on_redirect,
            on_failure=failures.append,
        )
        await provider.context.redirect_handler(
            "https://as.example.com/authorize?state=sdk-refused"
        )
        pending_authorizations.abandon("sdk-refused", "alice", reason="access_denied")

        with pytest.raises(McpAuthorizationError):
            await provider.context.callback_handler()
        assert [str(e) for e in failures] == ["access_denied"]

    async def test_a_connection_that_gives_up_drops_its_flow(self):
        from chainlit.mcp_oauth import pending_authorizations

        async def on_redirect(url: str) -> None:
            return None

        provider = build_oauth_provider(
            user_identifier="alice",
            server_url="https://jira.example.com/mcp",
            redirect_uri="https://app.example.com/mcp/oauth/callback",
            on_redirect=on_redirect,
        )
        await provider.context.redirect_handler(
            "https://as.example.com/authorize?state=sdk-given-up"
        )
        waiting = asyncio.create_task(provider.context.callback_handler())
        await asyncio.sleep(0)

        waiting.cancel()
        with pytest.raises(asyncio.CancelledError):
            await waiting

        # A callback arriving afterwards is refused, not completed into nothing.
        with pytest.raises(KeyError):
            pending_authorizations.resolve("sdk-given-up", "alice", "late-code")


class TestServerOAuthConfig:
    def test_oauth_is_off_unless_configured(self):
        server = StreamableHttpMcpServer(
            type="streamable-http", name="jira", url="https://mcp.example.com/mcp"
        )
        assert server.oauth is None

    def test_parses_from_the_config_file_shape(self):
        feature = McpFeature.model_validate(
            {
                "enabled": True,
                "servers": [
                    {
                        "name": "jira",
                        "type": "sse",
                        "url": "https://mcp.example.com/sse",
                        "oauth": {
                            "authorization_origins": ["https://auth.example.com"]
                        },
                    }
                ],
            }
        )

        server = feature.servers[0]
        assert not isinstance(server, StreamableHttpMcpServer)
        assert server.type == "sse"
        assert server.oauth is not None
        assert server.oauth.authorization_origins == ["https://auth.example.com"]

    @pytest.mark.parametrize(
        "origin",
        [
            "https://auth.example.com",
            "https://auth.example.com/",
            "http://localhost:9000",
        ],
    )
    def test_accepts_a_bare_origin(self, origin):
        assert McpServerOAuth(authorization_origins=[origin])

    @pytest.mark.parametrize(
        "origin",
        [
            "https://auth.example.com/oauth",
            "https://auth.example.com/?x=1",
            "https://auth.example.com/#frag",
            "https://user:pw@auth.example.com",
            "ftp://auth.example.com",
            "auth.example.com",
            "https://auth.example.com:99999",
        ],
    )
    def test_rejects_anything_but_a_bare_origin(self, origin):
        with pytest.raises(ValidationError):
            McpServerOAuth(authorization_origins=[origin])


class TestAuthorizationOrigins:
    """OAuth requests go through the same destination check as the connection."""

    def test_a_granted_origin_is_reachable(self):
        check = _destination_on_origin(
            "https://mcp.example.com/mcp", ["https://auth.example.com"]
        )
        check("https://mcp.example.com/.well-known/oauth-protected-resource")
        check("https://auth.example.com/.well-known/oauth-authorization-server")
        check("https://auth.example.com:443/token")

    @pytest.mark.parametrize(
        "url",
        [
            "https://evil.example.com/token",
            "http://auth.example.com/token",
            "https://auth.example.com:8443/token",
            "http://169.254.169.254/latest/meta-data/",
        ],
    )
    def test_anything_else_is_still_refused(self, url):
        check = _destination_on_origin(
            "https://mcp.example.com/mcp", ["https://auth.example.com"]
        )
        with pytest.raises(McpDestinationError):
            check(url)

    def test_without_a_grant_the_server_keeps_to_its_own_origin(self):
        check = _destination_on_origin("https://mcp.example.com/mcp")
        with pytest.raises(McpDestinationError):
            check("https://auth.example.com/token")
