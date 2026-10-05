"""Per-user OAuth token storage for MCP servers.

The MCP SDK's ``OAuthClientProvider`` handles discovery, dynamic client
registration and PKCE. It delegates persistence to a ``TokenStorage``, whose
methods take no arguments — the SDK expects one storage instance per
authorization context and has no notion of who the end user is.

That assumption holds for the single-user clients the SDK targets, where the
process belongs to one person. Chainlit is a multi-user server, so a storage
shared across requests would hand one user's access token to another. This
module supplies the missing scope: tokens are keyed by
``(user identifier, server)`` and a scoped view is handed to the SDK.

Two properties are load-bearing:

- A token is only ever readable by the user it was issued for, so a reconnect
  from another user cannot inherit it.
- A token is bound to the server that issued it, so it is never presented to a
  different server (the confused-deputy case).
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Awaitable, Callable, Dict, Optional, Tuple
from urllib.parse import parse_qs, urlsplit, urlunsplit

if TYPE_CHECKING:
    from mcp.shared.auth import OAuthClientInformationFull, OAuthToken

__all__ = [
    "AUTHORIZATION_TIMEOUT",
    "McpAuthorizationError",
    "McpOAuthTokenStore",
    "PendingAuthorizations",
    "ScopedTokenStorage",
    "build_oauth_provider",
    "canonical_server_key",
    "pending_authorizations",
    "token_store",
]

_DEFAULT_PORTS = {"http": "80", "https": "443"}

# How long a user has to finish authorizing in the browser. It bounds both the
# pending state and, in server.py, how long a connect request waits on it.
AUTHORIZATION_TIMEOUT = 300.0


class McpAuthorizationError(Exception):
    """The user's authorization ended without a code: refused, failed or dropped."""


def canonical_server_key(server_url: str) -> str:
    """Return a stable key identifying the MCP server behind ``server_url``.

    Only what RFC 3986 makes equivalent is normalised: scheme and host case,
    a default port, and an empty path. Everything else is kept as the MCP SDK
    keeps it in the RFC 8707 resource URL (``resource_url_from_server_url``):
    the exact path, trailing slash included, and the query, either of which can
    select a different server or tenant on one host. Sharing a token across
    those would present it to a server that did not ask for it.
    """
    parts = urlsplit(server_url)
    scheme = parts.scheme.lower()
    hostname = (parts.hostname or "").lower()
    # urlsplit strips an IPv6 literal's brackets; without them the port would
    # run into the address ("::1" + ":8443" reads as the host "::1:8443").
    host = f"[{hostname}]" if ":" in hostname else hostname

    netloc = host
    if parts.port is not None and _DEFAULT_PORTS.get(scheme) != str(parts.port):
        netloc = f"{host}:{parts.port}"

    # The fragment never reaches the server, and credentials in the netloc must
    # not leak into a dictionary key.
    return urlunsplit((scheme, netloc, parts.path or "/", parts.query, ""))


def extract_state(authorization_url: str) -> Optional[str]:
    """Return the ``state`` the SDK embedded in an authorization URL."""
    values = parse_qs(urlsplit(authorization_url).query).get("state")
    return values[0] if values else None


class McpOAuthTokenStore:
    """Holds MCP OAuth tokens for every user, keyed by user and server.

    The store is deliberately not a cache of one user's tokens: ``scoped()``
    is the only way to reach an entry, and it fixes both halves of the key up
    front so a caller cannot read across users by accident.
    """

    def __init__(self) -> None:
        self._tokens: Dict[Tuple[str, str], OAuthToken] = {}
        self._clients: Dict[Tuple[str, str], OAuthClientInformationFull] = {}

    def scoped(self, user_identifier: str, server_url: str) -> ScopedTokenStorage:
        """Return a ``TokenStorage`` bound to one user and one server."""
        if not user_identifier:
            raise ValueError(
                "An MCP OAuth token cannot be stored without a user identifier."
            )
        return ScopedTokenStorage(
            self, user_identifier, canonical_server_key(server_url)
        )

    def forget_user(self, user_identifier: str) -> None:
        """Drop every token held for a user, e.g. on logout."""
        for mapping in (self._tokens, self._clients):
            for key in [k for k in mapping if k[0] == user_identifier]:
                del mapping[key]

    def forget_server(self, user_identifier: str, server_url: str) -> None:
        """Drop the token a user holds for one server."""
        key = (user_identifier, canonical_server_key(server_url))
        self._tokens.pop(key, None)
        self._clients.pop(key, None)


class ScopedTokenStorage:
    """A ``mcp.client.auth.TokenStorage`` fixed to one user and one server."""

    def __init__(
        self, store: McpOAuthTokenStore, user_identifier: str, server_key: str
    ) -> None:
        self._store = store
        self._key = (user_identifier, server_key)

    @property
    def user_identifier(self) -> str:
        return self._key[0]

    @property
    def server_key(self) -> str:
        return self._key[1]

    async def get_tokens(self) -> Optional[OAuthToken]:
        return self._store._tokens.get(self._key)

    async def set_tokens(self, tokens: OAuthToken) -> None:
        self._store._tokens[self._key] = tokens

    async def get_client_info(self) -> Optional[OAuthClientInformationFull]:
        return self._store._clients.get(self._key)

    async def set_client_info(self, client_info: OAuthClientInformationFull) -> None:
        self._store._clients[self._key] = client_info


@dataclass
class _PendingAuthorization:
    user_identifier: str
    server_key: str
    expires_at: float
    # The callback can land before anyone awaits it, so the result is kept
    # here and the future is only created once a waiter appears — which also
    # keeps ``start()`` usable outside a running event loop.
    result: Optional[Tuple[str, Optional[str]]] = None
    future: Optional[asyncio.Future[Tuple[str, Optional[str]]]] = None
    cancelled: bool = False
    reason: Optional[str] = None

    def wait(self) -> asyncio.Future[Tuple[str, Optional[str]]]:
        if self.future is None:
            self.future = asyncio.get_running_loop().create_future()
            if self.result is not None:
                self.future.set_result(self.result)
            elif self.cancelled:
                self.future.set_exception(
                    McpAuthorizationError(self.reason or "Authorization cancelled.")
                )
        return self.future

    def _complete(self, value: Tuple[str, Optional[str]]) -> None:
        self.result = value
        if self.future is not None and not self.future.done():
            self.future.set_result(value)

    def _cancel(self, reason: str) -> None:
        # An error rather than ``future.cancel()``: a CancelledError raised
        # inside the SDK's auth flow reads as the connection itself being
        # cancelled, and carries no message to report.
        self.cancelled = True
        self.reason = reason
        if self.future is not None and not self.future.done():
            self.future.set_exception(McpAuthorizationError(reason))


class PendingAuthorizations:
    """Correlates an OAuth redirect back to the user who started it.

    The redirect leaves Chainlit and comes back on a shared callback route, so
    the ``state`` parameter is the only link to the originating user. Resolving
    a callback therefore requires the state to be known *and* to belong to the
    user presenting it — otherwise one user could complete another's flow and
    have the resulting token stored against them.

    States are single-use and expire, so a leaked redirect URL cannot be
    replayed later.
    """

    def __init__(self, ttl_seconds: float = AUTHORIZATION_TIMEOUT) -> None:
        self._ttl = ttl_seconds
        self._pending: Dict[str, _PendingAuthorization] = {}

    def register(
        self, state: str, user_identifier: str, server_url: str
    ) -> _PendingAuthorization:
        """Record the owner of an in-flight authorization.

        ``state`` is generated by the SDK and already embedded in the
        authorization URL, so it is passed in rather than minted here: the SDK
        compares the returned state against its own and would reject anything
        else. Await ``pending.wait()`` for the authorization code.
        """
        if not user_identifier:
            raise ValueError(
                "An MCP OAuth flow cannot be started without a user identifier."
            )
        if not state:
            raise ValueError("An MCP OAuth flow cannot be registered without a state.")
        self._drop_expired()
        pending = _PendingAuthorization(
            user_identifier=user_identifier,
            server_key=canonical_server_key(server_url),
            expires_at=time.monotonic() + self._ttl,
        )
        self._pending[state] = pending
        return pending

    def resolve(
        self, state: str, user_identifier: str, code: str
    ) -> _PendingAuthorization:
        """Complete the flow named by ``state`` on behalf of ``user_identifier``.

        Raises KeyError when the state is unknown, already used or expired, and
        PermissionError when it belongs to a different user.
        """
        self._drop_expired()
        pending = self._pending.get(state)
        if pending is None:
            raise KeyError("Unknown or expired OAuth state.")
        if pending.user_identifier != user_identifier:
            # Do not consume it: the rightful owner may still complete it.
            raise PermissionError("OAuth state belongs to a different user.")

        del self._pending[state]
        pending._complete((code, state))
        return pending

    def cancel(self, state: str, reason: str = "Authorization cancelled.") -> None:
        pending = self._pending.pop(state, None)
        if pending:
            pending._cancel(reason)

    def abandon(
        self,
        state: str,
        user_identifier: str,
        reason: str = "Authorization was not completed.",
    ) -> bool:
        """Drop a flow its owner has given up on, releasing the waiting caller.

        Ownership is checked for the same reason ``resolve`` checks it: without
        it, anyone holding a state could cancel someone else's connection.
        Returns whether anything was dropped.
        """
        self._drop_expired()
        pending = self._pending.get(state)
        if pending is None or pending.user_identifier != user_identifier:
            return False
        del self._pending[state]
        pending._cancel(reason)
        return True

    def __len__(self) -> int:
        self._drop_expired()
        return len(self._pending)

    def _drop_expired(self) -> None:
        now = time.monotonic()
        for state in [s for s, p in self._pending.items() if p.expires_at <= now]:
            self._pending.pop(state)._cancel("Authorization expired.")


# One store per Chainlit process. Tokens are held in memory: a restart forces a
# re-authorization, which is the safe default for credentials this sensitive.
token_store = McpOAuthTokenStore()
pending_authorizations = PendingAuthorizations()


def build_oauth_provider(
    user_identifier: str,
    server_url: str,
    redirect_uri: str,
    on_redirect: Callable[[str], Awaitable[None]],
    client_name: str = "Chainlit",
    on_failure: Optional[Callable[[McpAuthorizationError], None]] = None,
):
    """Build an SDK OAuth provider scoped to one user and one MCP server.

    The SDK owns discovery, dynamic client registration and PKCE. Chainlit
    supplies the two things it cannot know: which user this is, and how to get
    the authorization URL in front of them.

    The SDK also owns the ``state``: it mints one, embeds it in the
    authorization URL and compares the returned value against it. So the owner
    is recorded when the redirect is handed over, keyed by the state already in
    that URL — registering a Chainlit-generated state instead would key the map
    on a value the browser never echoes back.

    ``on_failure`` is called when the user's authorization ends without a code.
    The SDK transports swallow exceptions raised from their send loops, so
    raising alone would leave the connection waiting out its timeout; this is
    the same side channel ``make_mcp_http_client_factory``'s ``on_blocked`` is.
    """
    from mcp.client.auth import OAuthClientProvider
    from mcp.shared.auth import OAuthClientMetadata
    from pydantic import AnyUrl

    storage = token_store.scoped(user_identifier, server_url)
    flow: Dict[str, _PendingAuthorization] = {}
    flow_state: Dict[str, str] = {}

    async def redirect_handler(authorization_url: str) -> None:
        state = extract_state(authorization_url)
        if not state:
            raise ValueError(
                "The MCP authorization URL carries no state parameter, so the "
                "callback could not be matched to a user."
            )
        flow["pending"] = pending_authorizations.register(
            state, user_identifier, server_url
        )
        flow_state["state"] = state
        await on_redirect(authorization_url)

    # NOTE: mcp 1.x unpacks this as a (code, state) tuple; 2.0.0 expects an
    # AuthorizationCodeResult instead — update this on bump.
    async def callback_handler() -> Tuple[str, Optional[str]]:
        pending = flow.get("pending")
        if pending is None:  # pragma: no cover - the SDK always redirects first
            raise RuntimeError("MCP authorization was awaited before it started.")
        try:
            return await pending.wait()
        except McpAuthorizationError as exc:
            if on_failure is not None:
                on_failure(exc)
            raise
        except asyncio.CancelledError:
            # The connection gave up first (timeout, teardown). Drop the flow
            # so a late callback is refused instead of completing into nothing.
            pending_authorizations.cancel(flow_state["state"])
            raise

    return OAuthClientProvider(
        server_url=server_url,
        client_metadata=OAuthClientMetadata(
            client_name=client_name,
            redirect_uris=[AnyUrl(redirect_uri)],
            grant_types=["authorization_code", "refresh_token"],
            response_types=["code"],
        ),
        storage=storage,
        redirect_handler=redirect_handler,
        callback_handler=callback_handler,
    )
