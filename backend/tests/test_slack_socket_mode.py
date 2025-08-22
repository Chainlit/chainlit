# tests/test_slack_socket_mode.py
import importlib
from unittest.mock import AsyncMock, patch

import pytest


@pytest.mark.asyncio
async def test_start_socket_mode_starts_handler(monkeypatch):
    """
    The function should:
      • build an AsyncSocketModeHandler with the global slack_app
      • use the token found in SLACK_WEBSOCKET_TOKEN
      • await the handler.start_async() coroutine exactly once
    """
    token = "xapp-fake-token"
    # minimal env required for the Slack module to initialise
    monkeypatch.setenv("SLACK_BOT_TOKEN", "xoxb-fake-bot")
    monkeypatch.setenv("SLACK_WEBSOCKET_TOKEN", token)

    # Import the module first to avoid lazy import registry issues
    slack_app_mod = importlib.import_module("chainlit.slack.app")

    # Patch the object directly instead of using string path
    with patch.object(
        slack_app_mod, "AsyncSocketModeHandler", autospec=True
    ) as handler_cls:
        handler_instance = AsyncMock()
        handler_cls.return_value = handler_instance

        # Run: should build handler + await start_async
        await slack_app_mod.start_socket_mode()

        handler_cls.assert_called_once_with(slack_app_mod.slack_app, token)
        handler_instance.start_async.assert_awaited_once()


def test_slack_http_route_registered(monkeypatch):
    """
    When only the classic HTTP tokens are set (no websocket token),
    the FastAPI app should expose POST /slack/events.
    """
    # HTTP-only environment
    monkeypatch.setenv("SLACK_BOT_TOKEN", "xoxb-fake-bot")
    monkeypatch.setenv("SLACK_SIGNING_SECRET", "shhh-fake-secret")
    monkeypatch.delenv("SLACK_WEBSOCKET_TOKEN", raising=False)

    # Re-import server with the fresh env so the route table is built correctly
    server = importlib.reload(importlib.import_module("chainlit.server"))

    assert any(
        route.path == "/slack/events" and "POST" in route.methods
        for route in server.router.routes
    ), "Slack HTTP handler route was not registered"
