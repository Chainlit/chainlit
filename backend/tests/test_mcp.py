import asyncio
import inspect
import logging
import time
from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, create_autospec

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from chainlit.auth import get_current_user
from chainlit.mcp import (
    _RESTRICTED_HEADERS,
    HttpMcpConnection,
    McpDestinationError,
    SseMcpConnection,
    StdioMcpConnection,
    _destination_in_allowlist,
    _destination_on_origin,
    make_mcp_http_client_factory,
    validate_mcp_headers,
    validate_mcp_url,
)
from chainlit.session import McpSession, WebsocketSession
from chainlit.user import User

# NOTE: `chainlit.server` (and its FastAPI `app`) is imported lazily inside the
# fixtures below rather than at module import time. Importing it eagerly would
# make the entire module fail to *collect* (not just fail these tests) in any
# environment where the frontend hasn't been built yet — see
# `chainlit/server.py`'s `get_build_dir()`, which raises FileNotFoundError if
# `chainlit/frontend/dist` / `libs/copilot/dist` are missing. Deferring the
# import keeps sections A-C (which don't touch the server) collectible and
# runnable regardless of frontend build state.


class TestStdioMcpConnection:
    """Test suite for StdioMcpConnection model."""

    def test_stdio_connection_initialization(self):
        """Test StdioMcpConnection initialization."""
        connection = StdioMcpConnection(
            name="test_server", command="python", args=["-m", "mcp_server"]
        )

        assert connection.name == "test_server"
        assert connection.command == "python"
        assert connection.args == ["-m", "mcp_server"]
        assert connection.clientType == "stdio"

    def test_stdio_connection_with_empty_args(self):
        """Test StdioMcpConnection with empty args list."""
        connection = StdioMcpConnection(name="test_server", command="node", args=[])

        assert connection.args == []
        assert connection.clientType == "stdio"

    def test_stdio_connection_requires_name(self):
        """Test that StdioMcpConnection requires name."""
        with pytest.raises(ValidationError):
            StdioMcpConnection(command="python", args=[])

    def test_stdio_connection_requires_command(self):
        """Test that StdioMcpConnection requires command."""
        with pytest.raises(ValidationError):
            StdioMcpConnection(name="test_server", args=[])

    def test_stdio_connection_requires_args(self):
        """Test that StdioMcpConnection requires args."""
        with pytest.raises(ValidationError):
            StdioMcpConnection(name="test_server", command="python")

    def test_stdio_connection_client_type_is_literal(self):
        """Test that clientType is always 'stdio'."""
        connection = StdioMcpConnection(name="test_server", command="python", args=[])

        assert connection.clientType == "stdio"

    def test_stdio_connection_serialization(self):
        """Test StdioMcpConnection serialization."""
        connection = StdioMcpConnection(
            name="test_server", command="python", args=["-m", "server"]
        )

        data = connection.model_dump()

        assert data["name"] == "test_server"
        assert data["command"] == "python"
        assert data["args"] == ["-m", "server"]
        assert data["clientType"] == "stdio"


class TestSseMcpConnection:
    """Test suite for SseMcpConnection model."""

    def test_sse_connection_initialization(self):
        """Test SseMcpConnection initialization."""
        connection = SseMcpConnection(name="test_server", url="https://example.com/mcp")

        assert connection.name == "test_server"
        assert connection.url == "https://example.com/mcp"
        assert connection.headers is None
        assert connection.clientType == "sse"

    def test_sse_connection_with_headers(self):
        """Test SseMcpConnection with headers."""
        headers = {"Authorization": "Bearer token123", "X-Custom": "value"}
        connection = SseMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        assert connection.headers == headers

    def test_sse_connection_requires_name(self):
        """Test that SseMcpConnection requires name."""
        with pytest.raises(ValidationError):
            SseMcpConnection(url="https://example.com/mcp")

    def test_sse_connection_requires_url(self):
        """Test that SseMcpConnection requires url."""
        with pytest.raises(ValidationError):
            SseMcpConnection(name="test_server")

    def test_sse_connection_client_type_is_literal(self):
        """Test that clientType is always 'sse'."""
        connection = SseMcpConnection(name="test_server", url="https://example.com/mcp")

        assert connection.clientType == "sse"

    def test_sse_connection_serialization(self):
        """Test SseMcpConnection serialization."""
        headers = {"Authorization": "Bearer token"}
        connection = SseMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        data = connection.model_dump()

        assert data["name"] == "test_server"
        assert data["url"] == "https://example.com/mcp"
        assert data["headers"] == headers
        assert data["clientType"] == "sse"


class TestHttpMcpConnection:
    """Test suite for HttpMcpConnection model."""

    def test_http_connection_initialization(self):
        """Test HttpMcpConnection initialization."""
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp"
        )

        assert connection.name == "test_server"
        assert connection.url == "https://example.com/mcp"
        assert connection.headers is None
        assert connection.clientType == "streamable-http"

    def test_http_connection_with_headers(self):
        """Test HttpMcpConnection with headers."""
        headers = {
            "Authorization": "Bearer token123",
            "Content-Type": "application/json",
        }
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        assert connection.headers == headers

    def test_http_connection_requires_name(self):
        """Test that HttpMcpConnection requires name."""
        with pytest.raises(ValidationError):
            HttpMcpConnection(url="https://example.com/mcp")

    def test_http_connection_requires_url(self):
        """Test that HttpMcpConnection requires url."""
        with pytest.raises(ValidationError):
            HttpMcpConnection(name="test_server")

    def test_http_connection_client_type_is_literal(self):
        """Test that clientType is always 'streamable-http'."""
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp"
        )

        assert connection.clientType == "streamable-http"

    def test_http_connection_serialization(self):
        """Test HttpMcpConnection serialization."""
        headers = {"Authorization": "Bearer token"}
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        data = connection.model_dump()

        assert data["name"] == "test_server"
        assert data["url"] == "https://example.com/mcp"
        assert data["headers"] == headers
        assert data["clientType"] == "streamable-http"


@pytest.mark.parametrize(
    ("url", "allowed_urls", "should_raise", "error_match"),
    [
        # Basic exact match
        pytest.param(
            "https://api.example.com/mcp",
            ["https://api.example.com/mcp"],
            False,
            None,
            id="exact-match",
        ),
        # Sub-path allowed
        pytest.param(
            "https://api.example.com/mcp/tools",
            ["https://api.example.com/mcp"],
            False,
            None,
            id="valid-subpath-tools",
        ),
        # Different domain blocked
        pytest.param(
            "https://evil.com/mcp",
            ["https://api.example.com/mcp"],
            True,
            "not in the allowed",
            id="wrong-domain",
        ),
        # Empty allowlist blocks everything
        pytest.param(
            "https://api.example.com/mcp",
            [],
            True,
            "not in the allowed",
            id="empty-allowlist",
        ),
        # Blocked: path-sibling bypass — /v1-evil must NOT match allowlist entry /v1
        pytest.param(
            "https://api.example.com/v1-evil/steal",
            ["https://api.example.com/v1"],
            True,
            "not in the allowed",
            id="path-sibling-bypass",
        ),
        pytest.param(
            "https://api.example.com/v1beta",
            ["https://api.example.com/v1"],
            True,
            "not in the allowed",
            id="path-sibling-no-separator",
        ),
        # Accepted: genuine sub-path is fine
        pytest.param(
            "https://api.example.com/v1/tools",
            ["https://api.example.com/v1"],
            False,
            None,
            id="valid-subpath",
        ),
        # Documented: origin-only allowlist entry (empty path) permits any sub-path on that host
        pytest.param(
            "https://example.com/any/path",
            ["https://example.com"],
            False,
            None,
            id="origin-only-allows-any-subpath",
        ),
        # Contrast: path-restricted entry does NOT permit sibling paths (regression)
        pytest.param(
            "https://example.com/v1-evil",
            ["https://example.com/v1"],
            True,
            "not in the allowed",
            id="path-restricted-blocks-sibling",
        ),
        # Non-http(s) scheme must be blocked even against a non-empty allowlist
        pytest.param(
            "file:///etc/passwd",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="non-http-scheme-blocked",
        ),
        # Path traversal — all must be rejected against ["https://allowed.com/api"]
        pytest.param(
            "https://allowed.com/api/../../admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-dotdot-double",
        ),
        pytest.param(
            "https://allowed.com/api/./../admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-dot-dotdot",
        ),
        pytest.param(
            "https://allowed.com/api/%2e%2e/admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-encoded-dotdot-lower",
        ),
        pytest.param(
            "https://allowed.com/api/%2E%2E/admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-encoded-dotdot-upper",
        ),
        pytest.param(
            "https://allowed.com/api%2f..%2fadmin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-encoded-slash",
        ),
        pytest.param(
            "https://allowed.com/api/%252e%252e/admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-double-encoded",
        ),
        pytest.param(
            "https://allowed.com/api/..%5cadmin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-encoded-backslash",
        ),
        # Unicode confusables. Several of these fold to '.' or '/' under the
        # normalisation some origin servers apply, so an ASCII-only reject-list
        # would let them reopen traversal at the destination. The percent-encoded
        # variant is the form httpx actually puts on the wire.
        pytest.param(
            "https://allowed.com/api/\uff0e\uff0e/admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-fullwidth-full-stop",
        ),
        pytest.param(
            "https://allowed.com/api/%EF%BC%8E%EF%BC%8E/admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-encoded-fullwidth-full-stop",
        ),
        pytest.param(
            "https://allowed.com/api/\u2024\u2024/admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-one-dot-leader",
        ),
        pytest.param(
            "https://allowed.com/api\uff0f../admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-fullwidth-solidus",
        ),
        pytest.param(
            "https://allowed.com/api/\u2215../admin",
            ["https://allowed.com/api"],
            True,
            "not in the allowed",
            id="path-traversal-division-slash",
        ),
        # Positive controls — must still pass against ["https://allowed.com/api"]
        pytest.param(
            "https://allowed.com/api",
            ["https://allowed.com/api"],
            False,
            None,
            id="positive-exact-match",
        ),
        pytest.param(
            "https://allowed.com/api/sub",
            ["https://allowed.com/api"],
            False,
            None,
            id="positive-subpath",
        ),
        pytest.param(
            "https://ALLOWED.com/api",
            ["https://allowed.com/api"],
            False,
            None,
            id="positive-case-insensitive-host",
        ),
        pytest.param(
            "https://allowed.com:443/api",
            ["https://allowed.com/api"],
            False,
            None,
            id="positive-explicit-default-https-port",
        ),
    ],
)
def test_validate_mcp_url(url, allowed_urls, should_raise, error_match):
    """Test validate_mcp_url with various URL and allowlist combinations."""
    if should_raise:
        with pytest.raises(ValueError, match=error_match):
            validate_mcp_url(url, allowed_urls)
    else:
        validate_mcp_url(url, allowed_urls)  # should not raise


class TestValidateMcpUrl:
    """Additional test suite for validate_mcp_url function."""

    def test_http_scheme_blocked_when_allowlist_is_https(self):
        """HTTP should not match an HTTPS allowlist entry."""
        with pytest.raises(ValueError, match="not in the allowed"):
            validate_mcp_url(
                "http://api.example.com/mcp", ["https://api.example.com/mcp"]
            )

    def test_port_mismatch_blocked(self):
        """Different ports should be blocked."""
        with pytest.raises(ValueError, match="not in the allowed"):
            validate_mcp_url(
                "https://api.example.com:9000/mcp",
                ["https://api.example.com:8000/mcp"],
            )


class TestMcpConnectionEdgeCases:
    """Test suite for MCP connection edge cases."""

    def test_stdio_connection_with_complex_args(self):
        """Test StdioMcpConnection with complex arguments."""
        connection = StdioMcpConnection(
            name="complex_server",
            command="python",
            args=[
                "-m",
                "mcp_server",
                "--config",
                "/path/to/config.json",
                "--verbose",
            ],
        )

        assert len(connection.args) == 5
        assert connection.args[0] == "-m"
        assert connection.args[3] == "/path/to/config.json"

    def test_sse_connection_with_multiple_headers(self):
        """Test SseMcpConnection with multiple headers."""
        headers = {
            "Authorization": "Bearer token",
            "X-API-Key": "key123",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        connection = SseMcpConnection(
            name="multi_header_server", url="https://api.example.com", headers=headers
        )

        assert connection.headers is not None
        assert len(connection.headers) == 4
        assert connection.headers["Authorization"] == "Bearer token"
        assert connection.headers["X-API-Key"] == "key123"

    def test_http_connection_with_localhost_url(self):
        """Test HttpMcpConnection with localhost URL."""
        connection = HttpMcpConnection(
            name="local_server", url="http://localhost:8000/mcp"
        )

        assert connection.url == "http://localhost:8000/mcp"

    def test_connection_names_can_be_descriptive(self):
        """Test that connection names can be descriptive strings."""
        stdio_conn = StdioMcpConnection(
            name="My Custom MCP Server (Python)", command="python", args=[]
        )
        sse_conn = SseMcpConnection(
            name="Production API Server", url="https://api.example.com"
        )
        http_conn = HttpMcpConnection(
            name="Development Server - Local", url="http://localhost:3000"
        )

        assert "Python" in stdio_conn.name
        assert "Production" in sse_conn.name
        assert "Development" in http_conn.name


class TestConnectMCPRequestValidation:
    """Validate that ConnectMCPRequest enforces the user-provided contract."""

    def test_named_server_request_minimal(self):
        """Named server: only sessionId + name required."""
        from chainlit.types import ConnectMCPRequest

        req = ConnectMCPRequest(sessionId="sess-1", name="github")
        assert req.url is None
        assert req.clientType is None

    def test_user_provided_requires_both_url_and_client_type(self):
        """User-provided: url and clientType must both be present."""
        from pydantic import ValidationError

        from chainlit.types import ConnectMCPRequest

        with pytest.raises(ValidationError):
            ConnectMCPRequest(sessionId="sess-1", name="bad", url="https://example.com")
            # clientType is missing → validation error

        with pytest.raises(ValidationError):
            ConnectMCPRequest(
                sessionId="sess-1", name="bad", clientType="sse"
            )  # url is missing → validation error

    def test_stdio_client_type_is_not_accepted(self):
        """clientType='stdio' must be rejected by the type system (Pydantic Literal)."""
        from pydantic import ValidationError

        from chainlit.types import ConnectMCPRequest

        with pytest.raises(ValidationError):
            ConnectMCPRequest(
                sessionId="sess-1",
                name="bad",
                clientType="stdio",  # not in Literal["sse", "streamable-http"]
                url="https://example.com",
            )


class TestValidateMcpHeaders:
    """Test suite for validate_mcp_headers — strips credential/identity headers
    that must never be replayed to a user-provided MCP server."""

    @pytest.mark.parametrize("header_name", sorted(_RESTRICTED_HEADERS))
    def test_restricted_header_is_stripped(self, header_name):
        """Every header in _RESTRICTED_HEADERS — including the newly added
        cookie / forwarded / x-forwarded-* / x-real-ip entries — is removed."""
        headers = {header_name: "some-value", "X-Custom": "keep-me"}

        result = validate_mcp_headers(headers)

        assert result == {"X-Custom": "keep-me"}

    @pytest.mark.parametrize(
        "header_name",
        [
            "COOKIE",
            "Cookie",
            "cookie",
            "X-Forwarded-For",
            "x-forwarded-for",
            "X-FORWARDED-FOR",
        ],
    )
    def test_restricted_header_stripped_regardless_of_casing(self, header_name):
        result = validate_mcp_headers({header_name: "value", "Accept": "*/*"})

        assert result == {"Accept": "*/*"}

    def test_authorization_header_survives(self):
        """Deliberate product behavior: 'authorization' is NOT in
        _RESTRICTED_HEADERS. Forwarding a user-supplied token is the whole
        point of user-provided MCP servers — validate_mcp_url (allowlist) and
        no_redirect_http_client_factory (no redirect-chasing) are what scope
        where that token can go, not header stripping."""
        result = validate_mcp_headers({"Authorization": "Bearer secret-token"})

        assert result == {"Authorization": "Bearer secret-token"}

    def test_none_input_returns_none(self):
        assert validate_mcp_headers(None) is None

    def test_empty_dict_returns_none(self):
        assert validate_mcp_headers({}) is None

    def test_only_restricted_headers_returns_none(self):
        headers = {
            "Cookie": "a=b",
            "X-Forwarded-For": "1.2.3.4",
            "Host": "evil.com",
        }

        assert validate_mcp_headers(headers) is None

    def test_unknown_headers_pass_through_unchanged(self):
        headers = {"X-Api-Key": "abc123", "Accept-Language": "en-US"}

        assert validate_mcp_headers(headers) == headers


def _noop_check(url: str) -> None:
    """A permissive check_destination stand-in for tests that only care
    about the base httpx.AsyncClient configuration (redirects/timeout/
    headers/auth), not the destination-checking behavior itself."""


class TestMakeMcpHttpClientFactory:
    """Guards make_mcp_http_client_factory against a silent SDK regression:
    the `mcp` package hardcodes follow_redirects=True internally, so this
    factory (passed as httpx_client_factory=) is the only thing standing
    between an allowlisted MCP origin and an SSRF-via-redirect to an
    arbitrary host."""

    async def test_disables_redirects(self):
        """The cheapest guard against an `mcp` SDK upgrade silently
        reintroducing the open-redirect SSRF hole: if follow_redirects ever
        flips back to True here (e.g. a default changed upstream), this test
        fails immediately instead of quietly reopening 1.5a."""
        client = make_mcp_http_client_factory(_noop_check)()
        try:
            assert client.follow_redirects is False
        finally:
            await client.aclose()

    async def test_default_timeout_is_30_seconds(self):
        client = make_mcp_http_client_factory(_noop_check)()
        try:
            assert client.timeout == httpx.Timeout(30.0)
        finally:
            await client.aclose()

    async def test_passed_timeout_is_honored(self):
        custom_timeout = httpx.Timeout(5.0)
        client = make_mcp_http_client_factory(_noop_check)(timeout=custom_timeout)
        try:
            assert client.timeout == custom_timeout
        finally:
            await client.aclose()

    async def test_passed_headers_are_honored(self):
        client = make_mcp_http_client_factory(_noop_check)(headers={"X-Test": "value"})
        try:
            assert client.headers["x-test"] == "value"
        finally:
            await client.aclose()

    async def test_passed_auth_is_honored(self):
        class DummyAuth(httpx.Auth):
            def auth_flow(self, request):
                yield request

        auth = DummyAuth()
        client = make_mcp_http_client_factory(_noop_check)(auth=auth)
        try:
            assert client.auth is auth
        finally:
            await client.aclose()

    def test_sse_client_accepts_httpx_client_factory_kwarg(self):
        """If a future `mcp` SDK bump drops httpx_client_factory from
        sse_client, this fails loudly instead of connect_mcp silently
        ignoring our destination-checking factory and reopening the
        SSRF-via-redirect hole (1.5a)."""
        from mcp.client.sse import sse_client

        sig = inspect.signature(sse_client)
        assert "httpx_client_factory" in sig.parameters

    def test_streamablehttp_client_accepts_httpx_client_factory_kwarg(self):
        """Same regression guard as above, for the streamable-http transport."""
        from mcp.client.streamable_http import streamablehttp_client

        sig = inspect.signature(streamablehttp_client)
        assert "httpx_client_factory" in sig.parameters

    async def test_request_hook_calls_check_destination_for_every_request(self):
        """The whole point of hooking the client (rather than validating the
        URL we were handed) is that every outgoing request — not just the
        one connect_mcp initiated with — gets checked. Verify the hook is
        wired to check_destination at all before testing specific
        allow/block behaviors below."""
        calls = []

        def check(url: str) -> None:
            calls.append(url)

        client = make_mcp_http_client_factory(check)()
        try:
            hook = client.event_hooks["request"][0]
            await hook(httpx.Request("GET", "https://example.com/anything"))
        finally:
            await client.aclose()

        assert calls == ["https://example.com/anything"]

    async def test_on_blocked_callback_invoked_before_reraising(self):
        """`on_blocked` is server.py's fail-fast side channel
        (`_record_blocked`): mcp/client/sse.py and
        mcp/client/streamable_http.py swallow whatever the request hook
        raises (bare `except Exception: logger.exception(...)`, no
        re-raise), so without this callback a blocked destination would
        never unblock connect_mcp's bounded wait. Verify the callback
        receives the exact `McpDestinationError` synchronously, and that the
        hook still re-raises afterward -- callers that *do* propagate
        exceptions (like these tests calling the hook directly) must still
        see the failure."""
        holder: list = []

        def check(url: str) -> None:
            raise McpDestinationError(f"blocked: {url}")

        client = make_mcp_http_client_factory(check, on_blocked=holder.append)()
        try:
            hook = client.event_hooks["request"][0]
            with pytest.raises(McpDestinationError):
                await hook(httpx.Request("GET", "https://evil.example.com/x"))
        finally:
            await client.aclose()

        assert len(holder) == 1
        assert isinstance(holder[0], McpDestinationError)
        assert "evil.example.com" in str(holder[0])


class TestDestinationInAllowlistHook:
    """1.3a fix: the SSE transport takes its POST target from the server's
    `endpoint` event, and the SDK only validates that event's netloc/scheme —
    not its path. So a path-scoped allowlist entry like
    https://allowed.com/mcp/users/alice would, without this hook, let a
    malicious server advertise /admin and have every subsequent POST reach
    https://allowed.com/admin. The hook must block that and still allow
    genuine in-subtree traffic."""

    async def test_hook_blocks_out_of_subtree_destination(self):
        check = _destination_in_allowlist(["https://allowed.com/mcp/users/alice"])
        client = make_mcp_http_client_factory(check)()
        try:
            hook = client.event_hooks["request"][0]
            request = httpx.Request("POST", "https://allowed.com/admin")
            with pytest.raises(McpDestinationError):
                await hook(request)
        finally:
            await client.aclose()

    async def test_hook_allows_in_subtree_destination(self):
        check = _destination_in_allowlist(["https://allowed.com/mcp/users/alice"])
        client = make_mcp_http_client_factory(check)()
        try:
            hook = client.event_hooks["request"][0]
            request = httpx.Request(
                "POST", "https://allowed.com/mcp/users/alice/messages"
            )
            await hook(request)  # must not raise
        finally:
            await client.aclose()


class TestDestinationOnOriginHook:
    """Named servers are pinned to their configured origin, not their path
    subtree — the MCP SSE transport routinely advertises a message endpoint
    on a sibling path (/sse handing off to /messages/), so this must keep
    working; cross-origin movement must still be refused."""

    async def test_hook_allows_sibling_path_sse_to_messages(self):
        """The normal MCP SSE pattern — must not regress."""
        check = _destination_on_origin("https://server.example.com/sse")
        client = make_mcp_http_client_factory(check)()
        try:
            hook = client.event_hooks["request"][0]
            request = httpx.Request("POST", "https://server.example.com/messages/")
            await hook(request)  # must not raise
        finally:
            await client.aclose()

    async def test_hook_blocks_cross_origin(self):
        check = _destination_on_origin("https://server.example.com/sse")
        client = make_mcp_http_client_factory(check)()
        try:
            hook = client.event_hooks["request"][0]
            request = httpx.Request("POST", "https://evil.example.com/messages/")
            with pytest.raises(McpDestinationError):
                await hook(request)
        finally:
            await client.aclose()


# ── /mcp (connect_mcp) endpoint tests ──────────────────────────────────────


@pytest.fixture
def mcp_chainlit_app():
    """Return chainlit.server.app.

    Imported lazily so that the rest of this module stays collectible when the
    JS bundles haven't been built — chainlit/server.py's module-level
    get_build_dir() raises FileNotFoundError unless frontend/dist and
    libs/copilot/dist exist. Run `pnpm build` if this fixture errors.
    """
    from chainlit.server import app

    return app


@pytest.fixture
def test_client(mcp_chainlit_app):
    return TestClient(mcp_chainlit_app)


@pytest.fixture
def mock_get_current_user(mcp_chainlit_app):
    """Override get_current_user() dependency."""
    mcp_chainlit_app.dependency_overrides[get_current_user] = create_autospec(
        lambda: None
    )

    yield mcp_chainlit_app.dependency_overrides[get_current_user]

    del mcp_chainlit_app.dependency_overrides[get_current_user]


@pytest.fixture
def mcp_ws_session(persisted_test_user, test_config):
    """A Mock(spec=WebsocketSession) wired up with the bits connect_mcp needs:
    an id to look itself up by, a user for the auth-identity check, an empty
    mcp_sessions dict, and get_config() returning the mutable test_config.

    ``swap_mcp_session`` is bound to the *real* WebsocketSession
    implementation (operating on this mock's own ``mcp_sessions`` dict)
    rather than left as an auto-mocked attribute -- otherwise connect_mcp's
    atomic pop-then-store would silently no-op against a Mock and never
    touch ``mcp_sessions``, breaking every test below that asserts on it.
    """
    session = Mock(spec=WebsocketSession)
    session.id = "mcp_test_session_id"
    session.user = persisted_test_user
    session.mcp_sessions = {}
    session.get_config = Mock(return_value=test_config)
    session.swap_mcp_session = WebsocketSession.swap_mcp_session.__get__(
        session, WebsocketSession
    )
    return session


@pytest.fixture
def mcp_session_get_by_id_patched(
    mcp_ws_session: Mock, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(
        "chainlit.session.WebsocketSession.get_by_id",
        lambda session_id: mcp_ws_session if session_id == mcp_ws_session.id else None,
    )
    return mcp_ws_session


@pytest.fixture
def mock_mcp_transport(monkeypatch: pytest.MonkeyPatch):
    """Stub the SSE / streamable-http transports and ClientSession so a
    successful connect_mcp flow never touches the network or spawns a
    process."""

    async def fake_list_tools():
        return SimpleNamespace(tools=[SimpleNamespace(name="dummy_tool")])

    class FakeClientSession:
        # Set below to the dict the fake transports record into.
        captured: dict

        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc_info):
            return False

        async def initialize(self):
            return None

        async def list_tools(self):
            return await fake_list_tools()

    # What the transports were actually handed. Without this a test can only
    # check that the factory was *built*, not that it reached the transport --
    # so dropping the httpx_client_factory kwarg would go unnoticed.
    captured: dict = {}

    @asynccontextmanager
    async def fake_sse_client(url, headers=None, httpx_client_factory=None, **kwargs):
        captured["url"] = url
        captured["httpx_client_factory"] = httpx_client_factory
        yield (AsyncMock(), AsyncMock())

    @asynccontextmanager
    async def fake_streamablehttp_client(
        url, headers=None, httpx_client_factory=None, **kwargs
    ):
        captured["url"] = url
        captured["httpx_client_factory"] = httpx_client_factory
        yield (AsyncMock(), AsyncMock(), AsyncMock())

    monkeypatch.setattr("mcp.client.sse.sse_client", fake_sse_client)
    monkeypatch.setattr(
        "mcp.client.streamable_http.streamablehttp_client", fake_streamablehttp_client
    )
    monkeypatch.setattr("mcp.ClientSession", FakeClientSession)

    FakeClientSession.captured = captured
    return FakeClientSession


class TestConnectMcpEndpoint:
    """Test suite for POST /mcp (connect_mcp)."""

    def test_named_server_lookup_succeeds(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        from chainlit.config import SseMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(type="sse", name="github", url="https://mcp.example.com/sse")
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "github",
            },
        )

        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["mcp"]["name"] == "github"
        assert data["mcp"]["isUserProvided"] is False
        assert data["mcp"]["url"] is None
        assert data["mcp"]["headers"] is None

    def test_unknown_named_server_returns_400(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = []

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "does-not-exist",
            },
        )

        assert response.status_code == 400
        assert "not configured" in response.json()["detail"]

    def test_user_servers_disabled_rejects_user_supplied_url(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = False

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://foo.example.com",
                "clientType": "sse",
            },
        )

        assert response.status_code == 400

    def test_allowlisted_url_accepted(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/api",
                "clientType": "streamable-http",
            },
        )

        assert response.status_code == 200, response.text
        data = response.json()
        assert data["mcp"]["isUserProvided"] is True
        assert data["mcp"]["url"] == "https://allowed.example.com/api"

    def test_non_allowlisted_url_returns_400_not_500(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        """Regression guard: before this release a non-allowlisted URL could
        blow past validation and 500 rather than being cleanly rejected."""
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://evil.example.com",
                "clientType": "sse",
            },
        )

        assert response.status_code == 400, (
            f"expected a clean 400 rejection, got {response.status_code}: "
            f"{response.text}"
        )

    def test_user_supplied_stdio_client_type_rejected(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        """stdio is never user-provided — clientType is a Pydantic
        Literal["sse", "streamable-http"], so a "stdio" value fails request
        body validation before the handler even runs."""
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = ["https://any.example.com"]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://any.example.com",
                "clientType": "stdio",
            },
        )

        assert response.status_code == 422

    def test_named_server_secret_header_not_in_response_body(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        """1.4a response hygiene: a named server's developer-configured
        headers (which may contain secrets) must never be echoed back to the
        browser. Assert on the raw body text so a nested leak can't slip
        through a dict-shaped assertion."""
        from chainlit.config import SseMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(
                type="sse",
                name="secret-server",
                url="https://mcp.example.com/sse",
                headers={"Authorization": "Bearer supersecret"},
            )
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "secret-server",
            },
        )

        assert response.status_code == 200, response.text
        assert "supersecret" not in response.text

    def test_user_provided_name_collision_rejected_without_evicting_existing_session(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        """1.5c: a user-provided connection whose name matches a configured
        server is rejected — and, critically, the pre-existing session under
        that name must survive untouched (not evicted before the rejection)."""
        from chainlit.config import SseMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(type="sse", name="github", url="https://mcp.example.com/sse")
        ]
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://evil.example.com"
        ]

        sentinel_existing_session = Mock(name="pre-existing-mcp-session")
        mcp_session_get_by_id_patched.mcp_sessions["github"] = sentinel_existing_session

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "github",
                "url": "https://evil.example.com",
                "clientType": "sse",
            },
        )

        assert response.status_code == 400
        # The important half: the pre-existing session was NOT evicted.
        assert (
            mcp_session_get_by_id_patched.mcp_sessions["github"]
            is sentinel_existing_session
        )

    @pytest.mark.parametrize(
        "claimed_name", ["GitHub", "GITHUB", "  github  "], ids=["mixed", "upper", "ws"]
    )
    def test_name_collision_check_ignores_case_and_surrounding_whitespace(
        self,
        claimed_name: str,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        """A near-miss name must not slip past the reserved-name check.

        It would not evict the real session (dict keys differ), but it would
        render next to it in the UI as a convincing impersonation.
        """
        from chainlit.config import SseMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(type="sse", name="github", url="https://mcp.example.com/sse")
        ]
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://evil.example.com"
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": claimed_name,
                "url": "https://evil.example.com",
                "clientType": "sse",
            },
        )

        assert response.status_code == 400
        assert "reserved" in response.text

    def test_no_token_returns_401_when_auth_configured(
        self,
        test_client: TestClient,
        test_config,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """1.3 auth-gate regression: with login required and no token
        supplied, the real get_current_user dependency must reject the
        request with 401 before the handler body ever runs."""
        monkeypatch.setattr("chainlit.auth.require_login", lambda: True)

        response = test_client.post(
            "/mcp",
            json={"sessionId": "irrelevant", "name": "github"},
        )

        assert response.status_code == 401

    def test_token_identity_mismatch_returns_401(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        """1.3 auth-gate regression: a token that decodes to a different user
        than the one bound to the WebSocket session must be rejected, even
        though the token itself is otherwise valid."""
        mock_get_current_user.return_value = User(identifier="someone-else")
        test_config.features.mcp.enabled = True

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "github",
            },
        )

        assert response.status_code == 401

    def test_reconnect_with_now_invalid_url_does_not_evict_healthy_session_under_same_name(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        """Distinct from test_user_provided_name_collision_rejected_without_evicting_existing_session
        above: that test rejects a user-provided name because it collides
        with a *configured* server (fails the reserved-name check, before
        validate_mcp_url even runs). Here the name is a genuine
        user-provided name with no configured-server collision, and the
        request fails validate_mcp_url instead -- e.g. because the
        allowlist was tightened since the original connection was made.
        Eviction must still not have happened: it now runs only right
        before the new session is stored, well after this failure."""
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        sentinel_existing_session = Mock(name="pre-existing-mcp-session")
        mcp_session_get_by_id_patched.mcp_sessions["custom"] = sentinel_existing_session

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                # No longer in allowed_urls -- simulates the allowlist being
                # tightened after the original connection was established.
                "url": "https://revoked.example.com/gone",
                "clientType": "sse",
            },
        )

        assert response.status_code == 400
        assert (
            mcp_session_get_by_id_patched.mcp_sessions["custom"]
            is sentinel_existing_session
        )

    def test_failed_reconnect_does_not_evict_existing_session(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """A reconnect whose transport fails outright (reusing the
        failing_sse_client pattern from TestConnectMcpErrorHygiene) must
        leave the pre-existing session under that name untouched -- eviction
        only runs after on_mcp_connect has succeeded."""
        from chainlit.config import SseMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(
                type="sse", name="broken-server", url="https://mcp.example.com/sse"
            )
        ]

        sentinel_existing_session = Mock(name="pre-existing-mcp-session")
        mcp_session_get_by_id_patched.mcp_sessions["broken-server"] = (
            sentinel_existing_session
        )

        @asynccontextmanager
        async def failing_sse_client(
            url, headers=None, httpx_client_factory=None, **kwargs
        ):
            raise httpx.ConnectError(f"All connection attempts failed to {url}")
            yield  # pragma: no cover - unreachable; required for generator shape

        monkeypatch.setattr("mcp.client.sse.sse_client", failing_sse_client)

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "broken-server",
            },
        )

        assert response.status_code == 400
        assert (
            mcp_session_get_by_id_patched.mcp_sessions["broken-server"]
            is sentinel_existing_session
        )

    def test_successful_reconnect_evicts_old_session_and_calls_on_mcp_disconnect(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        """Once on_mcp_connect has succeeded for the replacement connection,
        the old same-named session must be evicted: on_mcp_disconnect
        called with (name, old_client), the old session closed, and the new
        session stored in its place."""
        from chainlit.session import McpSession

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        old_client = Mock(name="old-client")
        old_session = Mock(name="pre-existing-mcp-session")
        old_session.client = old_client
        old_session.close = AsyncMock()
        mcp_session_get_by_id_patched.mcp_sessions["custom"] = old_session

        on_mcp_disconnect = AsyncMock()
        test_config.code.on_mcp_disconnect = on_mcp_disconnect

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/api",
                "clientType": "sse",
            },
        )

        assert response.status_code == 200, response.text
        on_mcp_disconnect.assert_awaited_once_with("custom", old_client)
        old_session.close.assert_awaited_once()
        new_session = mcp_session_get_by_id_patched.mcp_sessions["custom"]
        assert new_session is not old_session
        assert isinstance(new_session, McpSession)

    def test_on_mcp_disconnect_error_does_not_block_new_session_from_being_stored(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        """on_mcp_disconnect is best-effort: an exception from the developer's
        callback must not prevent the old session from being closed or the
        new session from being stored."""
        from chainlit.session import McpSession

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        old_session = Mock(name="pre-existing-mcp-session")
        old_session.client = Mock(name="old-client")
        old_session.close = AsyncMock()
        mcp_session_get_by_id_patched.mcp_sessions["custom"] = old_session

        test_config.code.on_mcp_disconnect = AsyncMock(
            side_effect=RuntimeError("developer callback blew up")
        )

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/api",
                "clientType": "sse",
            },
        )

        assert response.status_code == 200, response.text
        old_session.close.assert_awaited_once()
        new_session = mcp_session_get_by_id_patched.mcp_sessions["custom"]
        assert new_session is not old_session
        assert isinstance(new_session, McpSession)

    def test_named_server_response_omits_client_type_and_sets_type(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        """`type` (not `clientType`) identifies a named server's transport
        in the response -- and the field that doesn't apply must be
        omitted entirely, not sent as null (IMcp declares both optional,
        not nullable)."""
        from chainlit.config import SseMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(type="sse", name="github", url="https://mcp.example.com/sse")
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "github",
            },
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert "clientType" not in body["mcp"]
        assert body["mcp"]["type"] == "sse"

    def test_user_provided_response_omits_type_and_sets_client_type(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        """Mirror of test_named_server_response_omits_client_type_and_sets_type:
        a user-provided connection's response carries `clientType`, and
        `type` (the named-server field) must be omitted entirely."""
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/api",
                "clientType": "streamable-http",
            },
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert "type" not in body["mcp"]
        assert body["mcp"]["clientType"] == "streamable-http"


class TestConnectMcpConcurrentReconnects:
    """Two concurrent ``POST /mcp`` reconnects for the same name used to be
    able to race: the eviction block popped the old session, awaited
    ``on_mcp_disconnect``/``close()``, and only then stored the new one --
    real ``await`` points sitting between the "is there an old session"
    check and the store. A second concurrent reconnect could see the name
    already popped, skip eviction, store its own session, and then have the
    first request resume and unconditionally overwrite it -- orphaning the
    second session's background task forever (a live stdio subprocess or
    open HTTP/SSE client, unreachable from ``mcp_sessions`` for
    ``WebsocketSession.delete()`` to ever close).

    ``WebsocketSession.swap_mcp_session`` closes this by making the
    check-then-store step a single ``await``-free dict pop+insert -- atomic
    under asyncio's cooperative scheduling, no lock required. These tests
    call ``connect_mcp`` directly (bypassing TestClient/ASGI, same technique
    as ``test_hung_task_is_cancelled_and_does_not_leak`` above) so the two
    concurrent requests share this test's own event loop and can be
    interleaved precisely with events.
    """

    @staticmethod
    def _pause_once_on_mcp_disconnect():
        """An on_mcp_disconnect callback that pauses only on its *first*
        call and passes straight through afterwards.

        With the race closed, a request that loses the swap race still
        legitimately evicts (and thus disconnects) whatever the winning
        request just stored -- so on_mcp_disconnect now fires more than
        once in this scenario. Pausing on every call would deadlock the
        test on itself (the pause is only released by the *other*
        request's handler returning); pausing once is enough to force the
        interleaving window the original bug needed.
        """
        reached = asyncio.Event()
        release = asyncio.Event()
        calls: list = []

        async def on_mcp_disconnect(name, client):
            index = len(calls)
            calls.append(client)
            if index == 0:
                reached.set()
                await release.wait()

        return on_mcp_disconnect, reached, release, calls

    @staticmethod
    def _make_mcp_session(name: str, client=None) -> McpSession:
        """A fake pre-existing McpSession whose background task actually
        waits on (and finishes as soon as) its own stop_event -- mirroring
        the real ``_mcp_session_runner``'s ``await stop_event.wait()`` loop.
        Without this, ``stop_mcp_task`` (called via ``McpSession.close()``)
        has nothing to wake the task up and has to sit out the full
        ``_CLOSE_TIMEOUT`` before force-cancelling it, making these tests
        slow and turning a clean shutdown into a CancelledError."""
        stop_event = asyncio.Event()

        async def _runner():
            await stop_event.wait()

        return McpSession(
            name=name,
            client=client if client is not None else Mock(name=f"{name}-client"),
            task=asyncio.create_task(_runner(), name=f"fake-mcp-session-{name}"),
            stop_event=stop_event,
        )

    @pytest.mark.asyncio
    async def test_concurrent_same_name_reconnects_leave_one_session_and_no_orphan(
        self,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_mcp_transport,
    ):
        from chainlit.server import connect_mcp
        from chainlit.types import ConnectMCPRequest

        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        on_mcp_disconnect, reached_disconnect, release_disconnect, _calls = (
            self._pause_once_on_mcp_disconnect()
        )
        test_config.code.on_mcp_disconnect = on_mcp_disconnect

        old_session = self._make_mcp_session("custom", client=Mock(name="old-client"))
        old_task = old_session.task
        mcp_session_get_by_id_patched.mcp_sessions["custom"] = old_session

        payload = ConnectMCPRequest(
            sessionId=mcp_session_get_by_id_patched.id,
            name="custom",
            url="https://allowed.example.com/api",
            clientType="sse",
        )

        async def request_b():
            # Let request A get moving first (reach the disconnect pause
            # while evicting old_session) before firing the second
            # concurrent reconnect for the same name.
            await reached_disconnect.wait()
            resp = await connect_mcp(payload=payload, current_user=None)
            b_session = mcp_session_get_by_id_patched.mcp_sessions.get("custom")
            release_disconnect.set()
            return resp, b_session

        task_a = asyncio.create_task(connect_mcp(payload=payload, current_user=None))
        task_b = asyncio.create_task(request_b())

        resp_a = await asyncio.wait_for(task_a, timeout=10)
        resp_b, b_session = await asyncio.wait_for(task_b, timeout=10)

        assert resp_a.status_code == 200, getattr(resp_a, "body", resp_a)
        assert resp_b.status_code == 200, getattr(resp_b, "body", resp_b)

        # Exactly one live session survives under the name.
        assert len(mcp_session_get_by_id_patched.mcp_sessions) == 1
        final_session = mcp_session_get_by_id_patched.mcp_sessions["custom"]

        # Whichever of {old_session, b_session} isn't the survivor must have
        # been properly torn down -- stop_event set and its background task
        # finished -- never silently orphaned.
        for label, sess in (("old", old_session), ("b", b_session)):
            if sess is None or sess is final_session:
                continue
            await asyncio.wait_for(sess.task, timeout=10)
            assert sess.stop_event.is_set(), (
                f"{label}'s session was never signalled to stop"
            )
            assert sess.task.done(), f"{label}'s background task leaked"

        old_task.cancel()
        try:
            await old_task
        except asyncio.CancelledError:
            pass
        final_session.task.cancel()
        try:
            await final_session.task
        except asyncio.CancelledError:
            pass

    @pytest.mark.asyncio
    async def test_concurrent_reconnects_for_different_names_do_not_serialise(
        self,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_mcp_transport,
    ):
        """Two concurrent reconnects for *different* names must not block on
        each other -- the fix must not introduce a session-wide bottleneck.
        Uses the same pause-on-first-call on_mcp_disconnect trick as above,
        but with each name having its own pre-existing session to evict: if
        the two reconnects were serialised against each other, the second
        one would never even start its own connect until the first's
        disconnect pause released -- so it wouldn't reach 'ready to
        connect' until release_disconnect fires. Asserting both complete
        without ever calling release_disconnect from outside proves they
        ran independently.
        """
        from chainlit.server import connect_mcp
        from chainlit.types import ConnectMCPRequest

        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        # Pauses forever on every call -- if the two reconnects (different
        # names) were serialised, the second would never reach this point
        # while the first is stuck here, and the test would time out.
        gate = asyncio.Event()

        async def on_mcp_disconnect(name, client):
            await gate.wait()

        test_config.code.on_mcp_disconnect = on_mcp_disconnect

        for name in ("custom-a", "custom-b"):
            mcp_session_get_by_id_patched.mcp_sessions[name] = self._make_mcp_session(
                name
            )

        payload_a = ConnectMCPRequest(
            sessionId=mcp_session_get_by_id_patched.id,
            name="custom-a",
            url="https://allowed.example.com/api",
            clientType="sse",
        )
        payload_b = ConnectMCPRequest(
            sessionId=mcp_session_get_by_id_patched.id,
            name="custom-b",
            url="https://allowed.example.com/api",
            clientType="sse",
        )

        task_a = asyncio.create_task(connect_mcp(payload=payload_a, current_user=None))
        task_b = asyncio.create_task(connect_mcp(payload=payload_b, current_user=None))

        # Both reconnects must reach (and get stuck in) their independent
        # on_mcp_disconnect calls without ever unblocking each other --
        # proof they proceeded concurrently rather than one waiting on a
        # lock held by the other.
        await asyncio.sleep(0.2)
        assert not task_a.done(), "reconnect for 'custom-a' did not even start"
        assert not task_b.done(), "reconnect for 'custom-b' did not even start"

        gate.set()

        resp_a = await asyncio.wait_for(task_a, timeout=10)
        resp_b = await asyncio.wait_for(task_b, timeout=10)

        assert resp_a.status_code == 200, getattr(resp_a, "body", resp_a)
        assert resp_b.status_code == 200, getattr(resp_b, "body", resp_b)

        for name in ("custom-a", "custom-b"):
            sess = mcp_session_get_by_id_patched.mcp_sessions[name]
            sess.task.cancel()
            try:
                await sess.task
            except asyncio.CancelledError:
                pass


class TestConnectMcpErrorHygiene:
    """Failures for a *named* (developer-configured) server must never echo
    the underlying exception back to the browser — httpx errors routinely
    embed the request URL, and for a named server that URL is developer
    config that may carry secrets in userinfo or query params. On a
    no-auth deployment anyone can pick a server name, trigger a failure, and
    read the URL back. User-provided connections already supplied their own
    URL, so returning detail there stays useful."""

    def test_named_server_failure_does_not_leak_configured_url(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
        caplog: pytest.LogCaptureFixture,
    ):
        from chainlit.config import SseMcpServer

        secret_url = "https://svc:s3cr3t-t0ken@internal.example.com/mcp"

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(type="sse", name="broken-server", url=secret_url)
        ]

        @asynccontextmanager
        async def failing_sse_client(
            url, headers=None, httpx_client_factory=None, **kwargs
        ):
            raise httpx.ConnectError(f"All connection attempts failed to {url}")
            yield  # pragma: no cover - unreachable; required for generator shape

        monkeypatch.setattr("mcp.client.sse.sse_client", failing_sse_client)

        with caplog.at_level(logging.ERROR, logger="chainlit"):
            response = test_client.post(
                "/mcp",
                json={
                    "sessionId": mcp_session_get_by_id_patched.id,
                    "name": "broken-server",
                },
            )

        assert response.status_code == 400
        assert "s3cr3t-t0ken" not in response.text
        assert "internal.example.com" not in response.text
        assert "check the server logs" in response.text.lower()
        # The operator can still find it — it went to the server logs instead.
        assert "s3cr3t-t0ken" in caplog.text

    def test_user_provided_failure_returns_useful_detail(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
    ):
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        @asynccontextmanager
        async def failing_streamablehttp_client(
            url, headers=None, httpx_client_factory=None, **kwargs
        ):
            raise httpx.ConnectError(f"All connection attempts failed to {url}")
            yield  # pragma: no cover - unreachable; required for generator shape

        monkeypatch.setattr(
            "mcp.client.streamable_http.streamablehttp_client",
            failing_streamablehttp_client,
        )

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/api",
                "clientType": "streamable-http",
            },
        )

        assert response.status_code == 400
        # The client already supplied this URL — echoing detail back is
        # useful, and the named-server generic message must NOT appear.
        assert "allowed.example.com" in response.text
        assert "check the server logs" not in response.text.lower()


class TestConnectMcpConnectTimeout:
    """The connect handler bounds how long it waits for a connection to come
    up: `await ready_event.wait()` became
    `asyncio.wait_for(ready_event.wait(), timeout=connect_timeout)`, and a
    blocked destination fires `ready_event` immediately via `_record_blocked`
    instead of waiting out the full timeout (the `mcp` SDK swallows the
    exception its own request hook raises, so without that side channel
    `ready_event` would never be set)."""

    @pytest.fixture(autouse=True)
    def _fast_task_teardown(self, monkeypatch: pytest.MonkeyPatch):
        """Every failure path below has stop_mcp_task reap a background task
        that's hung (on an unrelated wait, not on stop_event) -- so
        stop_mcp_task's own bounded wait-then-cancel (_CLOSE_TIMEOUT,
        10s by default) always has to run out before it cancels. Shrinking
        it keeps these tests fast without touching the connect-timeout
        constant under test, which each test manages independently."""
        monkeypatch.setattr("chainlit.session._CLOSE_TIMEOUT", 0.5)

    @staticmethod
    def _hanging_initialize_transport_and_session():
        """A transport that connects instantly and a ClientSession whose
        initialize() hangs forever -- simulates a server that accepts the
        connection and then never answers, which only the connect_timeout
        wrapper (not the transport itself) bounds."""

        @asynccontextmanager
        async def fake_sse_client(
            url, headers=None, httpx_client_factory=None, **kwargs
        ):
            yield (AsyncMock(), AsyncMock())

        class HangingInitializeClientSession:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *exc_info):
                return False

            async def initialize(self):
                await asyncio.Event().wait()  # never resolves

            async def list_tools(self):
                return SimpleNamespace(tools=[])  # pragma: no cover - unreachable

        return fake_sse_client, HangingInitializeClientSession

    @staticmethod
    def _blocked_swallowing_transport(blocked_url: str):
        """Mirrors what mcp/client/sse.py and mcp/client/streamable_http.py
        actually do: build the httpx client from the factory they were
        handed, let the request hook run, and swallow whatever it raises
        (bare `except Exception: logger.exception(...)`, no re-raise) --
        then hang, as the real SDK does once the connection never produces a
        response. `_record_blocked` (server.py) is the only reason
        connect_mcp doesn't hang here for the full connect timeout."""

        @asynccontextmanager
        async def blocked_swallowing_transport(
            url, headers=None, httpx_client_factory=None, **kwargs
        ):
            assert httpx_client_factory is not None
            client = httpx_client_factory()
            try:
                hook = client.event_hooks["request"][0]
                try:
                    await hook(httpx.Request("GET", blocked_url))
                except McpDestinationError:
                    pass
            finally:
                await client.aclose()
            await asyncio.Event().wait()  # simulate the SDK hanging afterwards
            yield (AsyncMock(), AsyncMock())  # pragma: no cover - unreachable

        return blocked_swallowing_transport

    def test_hang_during_initialize_times_out_and_returns_400(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """`_MCP_CONNECT_TIMEOUT_HTTP` is imported inside connect_mcp's
        function body (`from chainlit.mcp import (..., _MCP_CONNECT_TIMEOUT_HTTP, ...)`),
        so that import re-reads the module attribute on every call --
        monkeypatching `chainlit.mcp._MCP_CONNECT_TIMEOUT_HTTP` before the
        request takes effect, unlike a module-level `from ... import` that
        would have bound the value once at import time.

        Also guards a regression found while writing this test: the
        descriptive "Timed out after {N}s..." message used to be clobbered
        before it reached the response. `stop_mcp_task` cancels the
        still-hung background task, that cancellation raises inside the
        runner's `await mcp_client.initialize()`, and the runner's
        `except BaseException` recorded the resulting message-less
        CancelledError over the timeout message. The runner now only records
        an error if none was recorded yet ("first error wins"), so the
        causal message survives. Asserting on the message text below is what
        keeps that from silently regressing."""
        monkeypatch.setattr("chainlit.mcp._MCP_CONNECT_TIMEOUT_HTTP", 0.05)

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        fake_sse_client, HangingInitializeClientSession = (
            self._hanging_initialize_transport_and_session()
        )
        monkeypatch.setattr("mcp.client.sse.sse_client", fake_sse_client)
        monkeypatch.setattr("mcp.ClientSession", HangingInitializeClientSession)

        start = time.monotonic()
        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/api",
                "clientType": "sse",
            },
        )
        elapsed = time.monotonic() - start

        assert response.status_code == 400
        # The causal timeout message must survive the cancellation that
        # stop_mcp_task triggers -- see the docstring.
        assert "Timed out after" in response.json()["detail"]
        # Generous relative to the patched 0.05s timeout, but nowhere near
        # the real 30s default -- proves the wait is actually bounded.
        assert elapsed < 10, f"expected a bounded wait, took {elapsed:.2f}s"

    def test_blocked_destination_fails_fast_before_full_timeout_elapses(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Proves the *fail-fast* channel (_record_blocked / on_blocked), not
        the timeout, is what unblocks a request whose destination is
        rejected. The connect-timeout constant is deliberately left at its
        real (large) default here: if fail-fast regressed, the request
        would instead have to wait out the full timeout, and this test
        would take ~30s to fail. A response arriving in well under that can
        only be explained by the fail-fast channel firing."""
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        monkeypatch.setattr(
            "mcp.client.sse.sse_client",
            self._blocked_swallowing_transport("https://evil.example.com/steal"),
        )

        start = time.monotonic()
        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/api",
                "clientType": "sse",
            },
        )
        elapsed = time.monotonic() - start

        assert response.status_code == 400
        assert elapsed < 5, (
            f"took {elapsed:.2f}s -- fail-fast did not fire, the request "
            "waited out (part of) the real connect timeout instead"
        )

    @pytest.mark.parametrize(
        "scenario", ["timeout", "blocked_destination"], ids=["timeout", "blocked"]
    )
    def test_timeout_and_blocked_path_apply_named_server_redaction(
        self,
        scenario: str,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Both failure paths funnel through connect_mcp's same named-server
        redaction branch -- the destination (which may embed secrets in
        userinfo, per TestConnectMcpErrorHygiene) must never reach the
        browser, whether the failure was a timeout or a fail-fast block."""
        from chainlit.config import SseMcpServer

        secret_url = "https://svc:s3cr3t-t0ken@internal.example.com/sse"

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(type="sse", name="named-secret", url=secret_url)
        ]

        if scenario == "timeout":
            monkeypatch.setattr("chainlit.mcp._MCP_CONNECT_TIMEOUT_HTTP", 0.05)
            fake_sse_client, HangingInitializeClientSession = (
                self._hanging_initialize_transport_and_session()
            )
            monkeypatch.setattr("mcp.client.sse.sse_client", fake_sse_client)
            monkeypatch.setattr("mcp.ClientSession", HangingInitializeClientSession)
        else:
            monkeypatch.setattr(
                "mcp.client.sse.sse_client",
                self._blocked_swallowing_transport("https://evil.example.com/steal"),
            )

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "named-secret",
            },
        )

        assert response.status_code == 400
        assert "internal.example.com" not in response.text
        assert "s3cr3t-t0ken" not in response.text
        assert "evil.example.com" not in response.text
        assert "check the server logs" in response.text.lower()

    def test_blocked_destination_cause_reaches_the_operator_log(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
        caplog: pytest.LogCaptureFixture,
    ):
        """The response is deliberately redacted for a named server, so the
        operator log is the *only* place the real cause is recorded --
        which makes it load-bearing, not incidental.

        Regression guard: stop_mcp_task cancels the still-hung runner, and
        the runner's `except BaseException` used to record that
        message-less CancelledError over the McpDestinationError recorded
        by _record_blocked. That left the operator with a redacted response
        AND a log saying nothing but "CancelledError" -- no way to learn
        which destination was blocked. The runner now keeps the first
        error recorded."""
        from chainlit.config import SseMcpServer

        blocked = "https://evil.example.com/steal"

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(
                type="sse", name="named-secret", url="https://internal.example.com/sse"
            )
        ]
        monkeypatch.setattr(
            "mcp.client.sse.sse_client", self._blocked_swallowing_transport(blocked)
        )

        with caplog.at_level(logging.ERROR, logger="chainlit"):
            response = test_client.post(
                "/mcp",
                json={
                    "sessionId": mcp_session_get_by_id_patched.id,
                    "name": "named-secret",
                },
            )

        assert response.status_code == 400
        # Redacted for the browser ...
        assert blocked not in response.text
        assert "evil.example.com" not in response.text
        # ... but diagnosable for the operator. McpDestinationError names the
        # blocked *origin* rather than the full URL, so match on the host.
        assert "evil.example.com" in caplog.text
        assert "McpDestinationError" in caplog.text
        # The cancellation stop_mcp_task triggers must not have displaced it.
        assert "CancelledError" not in caplog.text

    @pytest.mark.asyncio
    async def test_hung_task_is_cancelled_and_does_not_leak(
        self,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        monkeypatch: pytest.MonkeyPatch,
    ):
        """Calls connect_mcp directly (bypassing TestClient/ASGI) so that
        asyncio.all_tasks() reflects exactly this test's own event loop.
        Going through TestClient would spin up (and, on return, fully tear
        down) its own portal/thread per request; that teardown reaps stray
        tasks on its own via asyncio's standard cancel-all-remaining-tasks
        shutdown, which would mask connect_mcp itself failing to clean up
        after the hung background task."""
        from chainlit.server import connect_mcp
        from chainlit.types import ConnectMCPRequest

        monkeypatch.setattr("chainlit.mcp._MCP_CONNECT_TIMEOUT_HTTP", 0.05)

        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/api"
        ]

        fake_sse_client, HangingInitializeClientSession = (
            self._hanging_initialize_transport_and_session()
        )
        monkeypatch.setattr("mcp.client.sse.sse_client", fake_sse_client)
        monkeypatch.setattr("mcp.ClientSession", HangingInitializeClientSession)

        payload = ConnectMCPRequest(
            sessionId=mcp_session_get_by_id_patched.id,
            name="custom",
            url="https://allowed.example.com/api",
            clientType="sse",
        )

        response = await connect_mcp(payload=payload, current_user=None)

        assert response.status_code == 400

        remaining_names = {t.get_name() for t in asyncio.all_tasks()}
        leaked = {n for n in remaining_names if n.startswith("mcp-session-custom")}
        assert not leaked, f"leaked background task(s): {leaked}"


class TestConnectMcpBindsDestination:
    """The destination-checking factory must actually reach the transport.

    The unit tests elsewhere prove the factory and its hook behave correctly in
    isolation, and the endpoint tests prove connect_mcp responds correctly --
    but neither notices if the `httpx_client_factory=` argument is dropped, so
    the factory would be built and silently discarded and every request would
    go out unchecked. That is the SPL-2026-002 bypass, so it needs its own
    guard: take the factory the transport was handed and prove it blocks.
    """

    @staticmethod
    async def _hook_verdict(factory, url: str) -> bool:
        """True if the factory's client would allow a request to url."""
        client = factory()
        try:
            hook = client.event_hooks["request"][0]
            try:
                await hook(httpx.Request("POST", url))
                return True
            except McpDestinationError:
                return False
        finally:
            await client.aclose()

    @pytest.mark.asyncio
    async def test_user_provided_transport_gets_allowlist_bound_factory(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [
            "https://allowed.example.com/mcp/alice"
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "custom",
                "url": "https://allowed.example.com/mcp/alice",
                "clientType": "sse",
            },
        )
        assert response.status_code == 200

        factory = mock_mcp_transport.captured["httpx_client_factory"]
        assert factory is not None, "transport was not given a bound client factory"

        # The SSE `endpoint` event could name any same-origin path; only the
        # granted subtree may be reached.
        assert await self._hook_verdict(
            factory, "https://allowed.example.com/mcp/alice/messages/?s=1"
        )
        assert not await self._hook_verdict(
            factory, "https://allowed.example.com/admin"
        )
        assert not await self._hook_verdict(factory, "https://evil.example.com/mcp")

    @pytest.mark.asyncio
    async def test_named_server_transport_gets_origin_bound_factory(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        mock_mcp_transport,
    ):
        from chainlit.config import SseMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            SseMcpServer(type="sse", name="named", url="https://named.example.com/sse")
        ]

        response = test_client.post(
            "/mcp",
            json={
                "sessionId": mcp_session_get_by_id_patched.id,
                "name": "named",
            },
        )
        assert response.status_code == 200

        factory = mock_mcp_transport.captured["httpx_client_factory"]
        assert factory is not None, "transport was not given a bound client factory"

        # Named servers are pinned to their origin, not their path, so the
        # standard /sse -> /messages/ handoff must keep working.
        assert await self._hook_verdict(
            factory, "https://named.example.com/messages/?s=1"
        )
        assert not await self._hook_verdict(factory, "https://evil.example.com/sse")


class TestConnectMcpStdioEnv:
    """StdioMcpServer.env restores the environment-variable support the
    deleted validate_mcp_command() used to provide by parsing
    `KEY=value cmd args`. The new schema carries env explicitly instead, and
    a leftover inline assignment must fail loudly rather than spawn
    'KEY=value' as the executable."""

    def test_env_merged_and_passed_to_stdio_server_parameters(
        self,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
        monkeypatch: pytest.MonkeyPatch,
    ):
        from chainlit.config import StdioMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            StdioMcpServer(
                type="stdio",
                name="gh",
                command="npx -y @modelcontextprotocol/server-github",
                env={"GITHUB_TOKEN": "abc123"},
            )
        ]

        captured: dict = {}

        class FakeClientSession:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *exc_info):
                return False

            async def initialize(self):
                return None

            async def list_tools(self):
                return SimpleNamespace(tools=[])

        @asynccontextmanager
        async def fake_stdio_client(server_params, **kwargs):
            captured["params"] = server_params
            yield (AsyncMock(), AsyncMock())

        monkeypatch.setattr("mcp.client.stdio.stdio_client", fake_stdio_client)
        monkeypatch.setattr("mcp.ClientSession", FakeClientSession)

        response = test_client.post(
            "/mcp",
            json={"sessionId": mcp_session_get_by_id_patched.id, "name": "gh"},
        )

        assert response.status_code == 200, response.text
        params = captured["params"]
        assert params.command == "npx"
        assert params.args == ["-y", "@modelcontextprotocol/server-github"]
        assert params.env is not None
        assert params.env["GITHUB_TOKEN"] == "abc123"

    @pytest.mark.parametrize(
        "command",
        [
            "GITHUB_TOKEN=abc123 npx -y @modelcontextprotocol/server-github",
            "env GITHUB_TOKEN=abc123 npx -y @modelcontextprotocol/server-github",
            "env -i GITHUB_TOKEN=abc123 npx -y @modelcontextprotocol/server-github",
            "env --ignore-environment GITHUB_TOKEN=abc123 npx -y @modelcontextprotocol/server-github",
            "env -u OTHER_VAR GITHUB_TOKEN=abc123 npx -y @modelcontextprotocol/server-github",
            "env --unset=OTHER_VAR GITHUB_TOKEN=abc123 npx -y @modelcontextprotocol/server-github",
        ],
        ids=[
            "bare",
            "via-env",
            "via-env-with-i-flag",
            "via-env-with-long-ignore-environment-flag",
            "via-env-with-u-flag-and-value",
            "via-env-with-long-unset-equals-flag",
        ],
    )
    def test_inline_env_assignment_in_command_returns_actionable_400(
        self,
        command: str,
        test_client: TestClient,
        test_config,
        mcp_session_get_by_id_patched: Mock,
        mock_get_current_user: Mock,
    ):
        """Migration trap: a config still using the legacy
        `KEY=value cmd args` form (from before StdioMcpServer.env existed)
        would otherwise get 'KEY=value' spawned as the executable — a
        baffling 'no such executable' error. Catch it explicitly instead.

        The `env KEY=value cmd` spelling is caught too; it would otherwise
        spawn successfully via /usr/bin/env and quietly skip this guidance."""
        from chainlit.config import StdioMcpServer

        mock_get_current_user.return_value = None
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            StdioMcpServer(type="stdio", name="legacy", command=command)
        ]

        response = test_client.post(
            "/mcp",
            json={"sessionId": mcp_session_get_by_id_patched.id, "name": "legacy"},
        )

        assert response.status_code == 400
        detail = response.json()["detail"]
        assert "GITHUB_TOKEN=abc123" in detail
        assert "env" in detail


class TestProjectSettingsMcpHygiene:
    """1.4e: /project/settings must not leak the SSRF allowlist."""

    def test_allowed_urls_not_disclosed(
        self,
        test_client: TestClient,
        test_config,
        mock_get_current_user: Mock,
    ):
        secret_url = "https://internal.example.com"
        test_config.features.mcp.enabled = True
        test_config.features.mcp.user_servers.enabled = True
        test_config.features.mcp.user_servers.allowed_urls = [secret_url]

        response = test_client.get("/project/settings")

        assert response.status_code == 200, response.text
        # Assert on the raw body text, not the parsed dict, so a nested leak
        # can't slip through.
        assert secret_url not in response.text
        data = response.json()
        assert data["features"]["mcp"]["user_servers"]["enabled"] is True

    def test_stdio_server_secrets_not_disclosed(
        self,
        test_client: TestClient,
        test_config,
        mock_get_current_user: Mock,
    ):
        """Only `name` and `type` may reach the browser for a configured
        stdio server -- `command` and `env` (which can carry credentials
        like GITHUB_TOKEN) must never be serialised into /project/settings."""
        from chainlit.config import StdioMcpServer

        secret_token = "abc123-super-secret"
        test_config.features.mcp.enabled = True
        test_config.features.mcp.servers = [
            StdioMcpServer(
                type="stdio",
                name="github",
                command="npx -y @modelcontextprotocol/server-github",
                env={"GITHUB_TOKEN": secret_token},
            )
        ]

        response = test_client.get("/project/settings")

        assert response.status_code == 200, response.text
        # Assert on the raw body text, not the parsed dict, so a nested leak
        # can't slip through.
        assert secret_token not in response.text
        assert "GITHUB_TOKEN" not in response.text
        assert "server-github" not in response.text

        data = response.json()
        servers = data["features"]["mcp"]["servers"]
        assert servers == [{"name": "github", "type": "stdio"}]
        for server in servers:
            assert set(server.keys()) == {"name", "type"}
            assert "env" not in server
            assert "command" not in server
            assert "url" not in server
            assert "headers" not in server
