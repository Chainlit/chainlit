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
import secrets
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Awaitable, Callable, Dict, Optional, Tuple
from urllib.parse import urlsplit, urlunsplit

if TYPE_CHECKING:
    from mcp.shared.auth import OAuthClientInformationFull, OAuthToken

__all__ = [
    "McpOAuthTokenStore",
    "PendingAuthorizations",
    "ScopedTokenStorage",
    "build_oauth_provider",
    "canonical_server_key",
    "pending_authorizations",
    "token_store",
]

_DEFAULT_PORTS = {"http": "80", "https": "443"}


def canonical_server_key(server_url: str) -> str:
    """Return a stable key identifying the MCP server behind ``server_url``.

    Scheme and host are compared case-insensitively and a default port is
    dropped, so the same server reached by equivalent URLs shares one token.
    The path is kept: two MCP servers are routinely mounted on one host, and
    collapsing them would let a token issued for one be sent to the other.
    """
    parts = urlsplit(server_url)
    scheme = parts.scheme.lower()
    hostname = (parts.hostname or "").lower()

    netloc = hostname
    if parts.port is not None and _DEFAULT_PORTS.get(scheme) != str(parts.port):
        netloc = f"{hostname}:{parts.port}"

    path = parts.path.rstrip("/")

    # Query and fragment never identify the server, and credentials in the
    # netloc must not leak into a dictionary key.
    return urlunsplit((scheme, netloc, path, "", ""))


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

    def wait(self) -> asyncio.Future[Tuple[str, Optional[str]]]:
        if self.future is None:
            self.future = asyncio.get_running_loop().create_future()
            if self.result is not None:
                self.future.set_result(self.result)
            elif self.cancelled:
                self.future.cancel()
        return self.future

    def _complete(self, value: Tuple[str, Optional[str]]) -> None:
        self.result = value
        if self.future is not None and not self.future.done():
            self.future.set_result(value)

    def _cancel(self) -> None:
        self.cancelled = True
        if self.future is not None and not self.future.done():
            self.future.cancel()


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

    def __init__(self, ttl_seconds: float = 300.0) -> None:
        self._ttl = ttl_seconds
        self._pending: Dict[str, _PendingAuthorization] = {}

    def start(
        self, user_identifier: str, server_url: str
    ) -> Tuple[str, _PendingAuthorization]:
        """Register a flow and return its ``state`` and the pending record.

        Await ``pending.wait()`` for the authorization code.
        """
        if not user_identifier:
            raise ValueError(
                "An MCP OAuth flow cannot be started without a user identifier."
            )
        self._drop_expired()
        # The state travels in the authorization URL, so it must be URL-safe.
        state = secrets.token_urlsafe(32)
        pending = _PendingAuthorization(
            user_identifier=user_identifier,
            server_key=canonical_server_key(server_url),
            expires_at=time.monotonic() + self._ttl,
        )
        self._pending[state] = pending
        return state, pending

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

    def cancel(self, state: str) -> None:
        pending = self._pending.pop(state, None)
        if pending:
            pending._cancel()

    def __len__(self) -> int:
        self._drop_expired()
        return len(self._pending)

    def _drop_expired(self) -> None:
        now = time.monotonic()
        for state in [s for s, p in self._pending.items() if p.expires_at <= now]:
            self._pending.pop(state)._cancel()


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
):
    """Build an SDK OAuth provider scoped to one user and one MCP server.

    The SDK owns discovery, dynamic client registration and PKCE. Chainlit
    supplies the two things it cannot know: which user this is, and how to get
    the authorization URL in front of them.
    """
    from mcp.client.auth import OAuthClientProvider
    from mcp.shared.auth import OAuthClientMetadata
    from pydantic import AnyUrl

    storage = token_store.scoped(user_identifier, server_url)
    state, pending = pending_authorizations.start(user_identifier, server_url)

    async def callback_handler() -> Tuple[str, Optional[str]]:
        return await pending.wait()

    provider = OAuthClientProvider(
        server_url=server_url,
        client_metadata=OAuthClientMetadata(
            client_name=client_name,
            redirect_uris=[AnyUrl(redirect_uri)],
            grant_types=["authorization_code", "refresh_token"],
            response_types=["code"],
        ),
        storage=storage,
        redirect_handler=on_redirect,
        callback_handler=callback_handler,
    )
    return provider, state
