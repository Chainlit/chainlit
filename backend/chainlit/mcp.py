from typing import Callable, Dict, Literal, Optional, Union
from urllib.parse import unquote, urlparse

import httpx
from pydantic import BaseModel


class StdioMcpConnection(BaseModel):
    name: str
    command: str
    args: list[str]
    clientType: Literal["stdio"] = "stdio"


class SseMcpConnection(BaseModel):
    name: str
    url: str
    headers: Optional[Dict[str, str]] = None
    clientType: Literal["sse"] = "sse"


class HttpMcpConnection(BaseModel):
    name: str
    url: str
    headers: Optional[Dict[str, str]] = None
    clientType: Literal["streamable-http"] = "streamable-http"


McpConnection = Union[StdioMcpConnection, SseMcpConnection, HttpMcpConnection]

# Headers that must never be forwarded from the browser to the MCP transport.
#
# Note: ``Authorization`` is deliberately absent — forwarding a user-supplied
# token is the point of user-provided servers. The allowlist scopes where it
# can be sent, and redirects are disabled so that destination cannot move.
_RESTRICTED_HEADERS = frozenset(
    {
        "host",
        "content-length",
        "transfer-encoding",
        "connection",
        "upgrade",
        "proxy-authorization",
        "te",
        "trailer",
        # Session credentials — must not be replayed to a third-party server.
        "cookie",
        # Spoofable client/origin identity, used to bypass upstream ACLs.
        "forwarded",
        "via",
        "x-forwarded-by",
        "x-forwarded-for",
        "x-forwarded-host",
        "x-forwarded-port",
        "x-forwarded-proto",
        "x-forwarded-server",
        "x-real-ip",
        # Routing/method overrides honoured by some proxies and frameworks,
        # which can reach endpoints the literal request line would not.
        "x-http-method-override",
        "x-method-override",
        "x-original-url",
        "x-rewrite-url",
    }
)


def _effective_port(parsed) -> int:
    """Return the TCP port for a parsed URL, inferring defaults for http/https."""
    if parsed.port is not None:
        return parsed.port
    return 443 if parsed.scheme == "https" else 80


def _path_matches(req_path: str, allowed_path: str) -> bool:
    """True if req_path equals or is a sub-path of allowed_path.

    Normalises allowed_path to end with '/' before the startswith check so
    that '/v1' does not accidentally match '/v1-evil'.

    Note: if allowed_path is empty (i.e. the allowlist entry is an origin with
    no path component, e.g. "https://example.com"), all sub-paths on that host
    are permitted. Use a path-restricted entry (e.g. "https://example.com/api")
    to limit access to a sub-tree.
    """
    norm = allowed_path.rstrip("/") + "/"
    return req_path == norm.rstrip("/") or req_path.startswith(norm)


def _has_ambiguous_path(raw_path: str) -> bool:
    """True if raw_path contains constructs that could change meaning in transit.

    We reject rather than normalise. Decoding first would let ``%2f`` create
    path-segment boundaries that were not in the original URI, manufacturing a
    passing path from a malicious one, and re-implementing RFC 3986 dot-segment
    removal would leave us permanently obliged to match httpx byte for byte.
    None of these constructs belong in a configured MCP endpoint.

    Deliberately operates on the *raw* percent-encoded path rather than
    ``httpx.URL(url).path``: httpx pre-decodes ``%2e``/``%2f``, which would make
    the marker check below blind to exactly the sequences it exists to catch.
    """
    lowered = raw_path.lower()
    # %2e -> '.', %2f -> '/', %5c -> '\', %25 -> a second decoding pass
    # downstream. Backslash is a separator on some origin servers and is left
    # untouched by httpx.
    if any(marker in lowered for marker in ("%2e", "%2f", "%5c", "%25")):
        return True
    if "\\" in raw_path:
        return True
    if any(segment in (".", "..") for segment in raw_path.split("/")):
        return True

    # Non-ASCII characters are rejected outright, before and after a single
    # decode. Many code points fold to '.', '/' or '\' under the normalisation
    # some origin servers and proxies apply (U+FF0E, U+2024, U+FF0F, U+2215,
    # U+2044, ...), which would reopen traversal at the destination. Enumerating
    # them is a denylist that keeps coming up short, so we require the path to
    # be ASCII instead — a positive rule, and no real MCP endpoint needs more.
    if not raw_path.isascii():
        return True
    try:
        decoded = unquote(raw_path, errors="strict")
    except UnicodeDecodeError:
        return True
    return not decoded.isascii()


def validate_mcp_url(url: str, allowed_urls: list[str]) -> None:
    """Validate that a user-provided MCP URL is in the allowlist.

    Raises ValueError if the URL is not permitted.
    """
    if not allowed_urls:
        raise ValueError(
            f"URL {url!r} is not in the allowed MCP URL list. "
            "Configure features.mcp.user_servers.allowed_urls in your config."
        )

    # Parse the request URL through httpx, which is what the MCP transports
    # dispatch with. Validating anything else risks approving a URL that
    # differs from the one that actually goes on the wire.
    try:
        parsed = httpx.URL(url)
    except Exception as exc:
        raise ValueError(
            f"URL {url!r} is not in the allowed MCP URL list. It could not be parsed."
        ) from exc

    if parsed.scheme not in ("http", "https"):
        raise ValueError(
            f"URL {url!r} is not in the allowed MCP URL list. "
            "Only http and https URLs are supported."
        )

    if _has_ambiguous_path(urlparse(url).path):
        raise ValueError(
            f"URL {url!r} is not in the allowed MCP URL list. Its path must not "
            "contain '.' or '..' segments, encoded separators (%2e, %2f, %5c), "
            "backslashes, double-encoded sequences (%25), or non-ASCII "
            "characters."
        )

    for allowed in allowed_urls:
        allowed_parsed = urlparse(allowed)
        if (
            parsed.scheme == allowed_parsed.scheme
            and parsed.host == allowed_parsed.hostname
            and _effective_port(parsed) == _effective_port(allowed_parsed)
            and _path_matches(parsed.path or "/", allowed_parsed.path or "/")
        ):
            return

    raise ValueError(
        f"URL {url!r} is not in the allowed MCP URL list. "
        "Configure features.mcp.user_servers.allowed_urls in your config."
    )


def validate_mcp_headers(
    headers: Optional[Dict[str, str]],
) -> Optional[Dict[str, str]]:
    """Strip restricted headers from a user-supplied headers dict.

    Returns a filtered copy (or None if no headers remain / input is None).
    """
    if not headers:
        return None
    filtered = {
        k: v for k, v in headers.items() if k.lower() not in _RESTRICTED_HEADERS
    }
    return filtered or None


class McpDestinationError(Exception):
    """An MCP transport tried to reach a destination outside its grant."""


def _destination_in_allowlist(allowed_urls: list[str]):
    """Permit only destinations the user's allowlist covers."""

    def check(url: str) -> None:
        try:
            validate_mcp_url(url, allowed_urls)
        except ValueError as exc:
            raise McpDestinationError(str(exc)) from None

    return check


def _destination_on_origin(configured_url: str):
    """Permit any path on the configured server's own origin.

    Named servers are pinned to their origin rather than their path subtree:
    the MCP SSE transport routinely advertises a message endpoint on a sibling
    path (``/sse`` handing off to ``/messages/``), so a path constraint would
    reject conforming servers. Cross-origin movement is still refused.
    """
    expected = httpx.URL(configured_url)

    def check(url: str) -> None:
        actual = httpx.URL(url)
        if (
            actual.scheme != expected.scheme
            or actual.host != expected.host
            or _effective_port(actual) != _effective_port(expected)
        ):
            raise McpDestinationError(
                f"MCP server tried to reach {actual.scheme}://{actual.netloc.decode()}, "
                "which is not the origin it was configured with."
            )

    return check


McpHttpClientFactory = Callable[..., httpx.AsyncClient]

# Bounds for how long the /mcp connect handler waits for a connection to
# come up, in server.py. Co-located here (rather than a new McpFeature
# config knob) to avoid adding parsing/validation surface and a footgun —
# too low a value breaks `npx -y` cold starts — in a security release.
_MCP_CONNECT_TIMEOUT_STDIO = 120.0  # npx -y can cold-download on first run
_MCP_CONNECT_TIMEOUT_HTTP = 30.0


def make_mcp_http_client_factory(
    check_destination: Callable[[str], None],
    on_blocked: Optional[Callable[[McpDestinationError], None]] = None,
) -> McpHttpClientFactory:
    """Build the httpx client factory used by the SSE and streamable-http transports.

    Mirrors ``mcp.shared._httpx_utils.create_mcp_http_client`` — which sets only
    ``follow_redirects``, ``timeout``, ``headers`` and ``auth`` — with two
    additions, both there because validating the URL we were *handed* does not
    constrain the requests the transport actually makes:

    - Redirects are not followed. The SDK hardcodes ``follow_redirects=True``,
      so otherwise only the first hop is checked and any permitted origin could
      redirect the connection somewhere else, forwarding headers to the target.
    - Every outgoing request is re-checked against ``check_destination``. The
      SSE transport takes its POST target from the server's ``endpoint`` event,
      and the SDK accepts any same-origin value — including one outside the
      path subtree the allowlist granted. Hooking the client binds the grant to
      the wire rather than to a single string, so this holds for the initial
      GET, the endpoint POSTs, and anything the SDK adds later.

    ``on_blocked``, if given, is called synchronously with the raised
    ``McpDestinationError`` before it propagates. This is a fail-fast side
    channel: ``mcp/client/sse.py`` and ``mcp/client/streamable_http.py`` wrap
    their send loops in a bare ``except Exception: logger.exception(...)``
    with no re-raise, so the exception itself never reaches
    ``ClientSession.initialize()`` — callers that only awaited the SDK would
    hang forever. The callback lets ``server.py`` unblock its wait
    immediately instead. Kept as a plain callback (not a mutable holder
    threaded through here) so this module stays free of asyncio primitives
    and stays synchronously testable.

    Passed as ``httpx_client_factory=`` to ``sse_client`` and
    ``streamablehttp_client``. That parameter is present unchanged across the
    supported ``mcp>=1.11.0,<2.0.0`` range.
    """

    def factory(
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[httpx.Timeout] = None,
        auth: Optional[httpx.Auth] = None,
    ) -> httpx.AsyncClient:
        async def _check_request(request: httpx.Request) -> None:
            try:
                check_destination(str(request.url))
            except McpDestinationError as exc:
                if on_blocked is not None:
                    on_blocked(exc)
                raise

        return httpx.AsyncClient(
            follow_redirects=False,
            timeout=timeout if timeout is not None else httpx.Timeout(30.0),
            headers=headers,
            auth=auth,
            event_hooks={"request": [_check_request]},
        )

    return factory
