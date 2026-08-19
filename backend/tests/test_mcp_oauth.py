import pytest
from mcp.client.auth import OAuthClientProvider
from mcp.shared.auth import (
    OAuthClientInformationFull,
    OAuthClientMetadata,
    OAuthToken,
)

from chainlit.mcp_oauth import (
    McpOAuthTokenStore,
    PendingAuthorizations,
    ScopedTokenStorage,
    canonical_server_key,
)


def make_token(access_token: str) -> OAuthToken:
    return OAuthToken(access_token=access_token, token_type="Bearer")


def make_client_info(client_id: str) -> OAuthClientInformationFull:
    return OAuthClientInformationFull(
        client_id=client_id,
        redirect_uris=["https://app.example.com/mcp/oauth/callback"],
    )


class TestCanonicalServerKey:
    """The key decides which token is reused, so equivalence must be exact."""

    @pytest.mark.parametrize(
        ("a", "b"),
        [
            ("https://mcp.example.com/sse", "https://MCP.Example.com/sse"),
            ("https://mcp.example.com/sse", "https://mcp.example.com/sse/"),
            ("https://mcp.example.com/sse", "https://mcp.example.com:443/sse"),
            ("http://mcp.example.com/sse", "http://mcp.example.com:80/sse"),
            ("https://mcp.example.com/sse", "https://mcp.example.com/sse?x=1"),
            ("https://mcp.example.com/sse", "https://mcp.example.com/sse#frag"),
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
        await store.scoped("alice", "https://Jira.Example.com/mcp/").set_tokens(
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

        store.forget_server("alice", "https://JIRA.example.com/mcp/")

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
        state, flow = pending.start("alice", "https://jira.example.com/mcp")

        resolved = pending.resolve(state, "alice", "auth-code")

        assert resolved.user_identifier == "alice"
        assert resolved.server_key == "https://jira.example.com/mcp"
        assert await flow.wait() == ("auth-code", state)

    async def test_another_user_cannot_complete_someone_elses_flow(self):
        pending = PendingAuthorizations()
        state, flow = pending.start("alice", "https://jira.example.com/mcp")

        with pytest.raises(PermissionError):
            pending.resolve(state, "mallory", "stolen-code")

        # Alice's flow survives so she can still finish it.
        assert flow.result is None
        pending.resolve(state, "alice", "auth-code")
        assert await flow.wait() == ("auth-code", state)

    async def test_a_state_cannot_be_replayed(self):
        pending = PendingAuthorizations()
        state, _flow = pending.start("alice", "https://jira.example.com/mcp")
        pending.resolve(state, "alice", "auth-code")

        with pytest.raises(KeyError):
            pending.resolve(state, "alice", "auth-code")

    def test_an_unknown_state_is_rejected(self):
        pending = PendingAuthorizations()
        with pytest.raises(KeyError):
            pending.resolve("never-issued", "alice", "code")

    async def test_states_are_unique_per_flow(self):
        pending = PendingAuthorizations()
        first, _f1 = pending.start("alice", "https://jira.example.com/mcp")
        second, _f2 = pending.start("alice", "https://jira.example.com/mcp")
        assert first != second

    async def test_expired_flows_are_dropped(self):
        pending = PendingAuthorizations(ttl_seconds=0)
        state, flow = pending.start("alice", "https://jira.example.com/mcp")

        with pytest.raises(KeyError):
            pending.resolve(state, "alice", "auth-code")
        assert len(pending) == 0
        assert flow.cancelled

    async def test_cancel_releases_the_waiter(self):
        pending = PendingAuthorizations()
        state, flow = pending.start("alice", "https://jira.example.com/mcp")

        pending.cancel(state)

        assert flow.cancelled
        assert len(pending) == 0

    def test_a_flow_requires_a_user_identifier(self):
        pending = PendingAuthorizations()
        with pytest.raises(ValueError, match="user identifier"):
            pending.start("", "https://example.com/mcp")


class TestScopeAccessors:
    def test_exposes_the_scope_it_is_bound_to(self):
        scoped = McpOAuthTokenStore().scoped("alice", "https://Example.com/mcp/")
        assert isinstance(scoped, ScopedTokenStorage)
        assert scoped.user_identifier == "alice"
        assert scoped.server_key == "https://example.com/mcp"


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

        state, _flow = pending_authorizations.start(
            "alice", "https://jira.example.com/mcp"
        )
        client = client_and_user("alice")

        res = client.get(f"/mcp/oauth/callback?code=abc&state={state}")

        assert res.status_code == 200

    def test_another_user_is_refused(self, client_and_user):
        from chainlit.mcp_oauth import pending_authorizations

        state, flow = pending_authorizations.start(
            "alice", "https://jira.example.com/mcp"
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
        client = client_and_user("alice")
        res = client.get("/mcp/oauth/callback?state=abc")
        assert res.status_code == 400
