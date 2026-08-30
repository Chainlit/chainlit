from unittest.mock import AsyncMock, patch

import pytest

import chainlit as cl
from chainlit.session import HTTPSession, WebsocketSession
from tests.conftest import create_chainlit_context


@pytest.mark.asyncio
async def test_set_chat_profile_feature_disabled(test_config, mock_session):
    """Test that set_chat_profile returns False when feature is disabled or unexistent."""
    test_config.features.hot_swap_chat_profile = False

    async with create_chainlit_context(mock_session):
        result = await cl.set_chat_profile("GPT-4")
        assert result is False


@pytest.mark.asyncio
async def test_set_chat_profile_no_context(test_config):
    """Test that set_chat_profile returns False when outside ChainlitContext."""
    test_config.features.hot_swap_chat_profile = True
    result = await cl.set_chat_profile("GPT-4")
    assert result is False


@pytest.mark.asyncio
async def test_set_chat_profile_http_session(test_config):
    """Test that set_chat_profile returns False for non-WebsocketSession (e.g. HTTPSession)."""
    test_config.features.hot_swap_chat_profile = True
    http_session = HTTPSession(
        id="http_id",
        client_type="copilot",
    )

    async with create_chainlit_context(http_session):
        result = await cl.set_chat_profile("GPT-4")
        assert result is False


@pytest.mark.asyncio
async def test_set_chat_profile_success(test_config):
    """Test successful hot-swap updates session and emits event."""
    test_config.features.hot_swap_chat_profile = True
    test_config.code.set_chat_profiles = AsyncMock(
        return_value=[
            cl.ChatProfile(name="GPT-3.5", markdown_description="GPT-3.5 profile"),
            cl.ChatProfile(name="GPT-4", markdown_description="GPT-4 profile"),
        ]
    )

    session = WebsocketSession(
        id="ws_id",
        socket_id="socket_123",
        emit=AsyncMock(),
        emit_call=AsyncMock(),
        user_env={},
        client_type="webapp",
    )
    session.chat_profile = "GPT-3.5"

    async with create_chainlit_context(session) as ctx:
        result = await cl.set_chat_profile("GPT-4")
        assert result is True
        assert session.chat_profile == "GPT-4"
        ctx.emitter.emit.assert_called_once_with(
            "chat_profile_updated",
            {"chatProfile": "GPT-4", "ok": True},
        )


@pytest.mark.asyncio
async def test_set_chat_profile_invalid_name(test_config):
    """Test hot-swap with invalid profile name returns False."""
    test_config.features.hot_swap_chat_profile = True
    test_config.code.set_chat_profiles = AsyncMock(
        return_value=[
            cl.ChatProfile(name="GPT-3.5", markdown_description="GPT-3.5 profile"),
        ]
    )

    session = WebsocketSession(
        id="ws_id",
        socket_id="socket_123",
        emit=AsyncMock(),
        emit_call=AsyncMock(),
        user_env={},
        client_type="webapp",
    )

    async with create_chainlit_context(session) as ctx:
        result = await cl.set_chat_profile("NonExistentProfile")
        assert result is False
        ctx.emitter.emit.assert_not_called()


@pytest.mark.asyncio
async def test_set_chat_profile_persists_to_data_layer(test_config):
    """Test that set_chat_profile updates thread in data layer when thread is active."""
    test_config.features.hot_swap_chat_profile = True
    test_config.features.auto_tag_thread = True
    test_config.code.set_chat_profiles = AsyncMock(
        return_value=[
            cl.ChatProfile(name="GPT-4", markdown_description="GPT-4 profile"),
        ]
    )

    mock_dl = AsyncMock()

    session = WebsocketSession(
        id="ws_id",
        socket_id="socket_123",
        emit=AsyncMock(),
        emit_call=AsyncMock(),
        user_env={},
        client_type="webapp",
        thread_id="thread_abc",
    )
    session.has_first_interaction = True

    with patch("chainlit.data.get_data_layer", return_value=mock_dl):
        async with create_chainlit_context(session):
            result = await cl.set_chat_profile("GPT-4")
            assert result is True
            mock_dl.update_thread.assert_called_once_with(
                thread_id="thread_abc",
                metadata=session.to_persistable(),
                tags=["GPT-4"],
            )


@pytest.mark.asyncio
async def test_set_chat_profile_data_layer_exception_handled(test_config):
    """Test that exceptions during data layer update are logged and do not fail the call."""
    test_config.features.hot_swap_chat_profile = True
    test_config.code.set_chat_profiles = AsyncMock(
        return_value=[
            cl.ChatProfile(name="GPT-4", markdown_description="GPT-4 profile"),
        ]
    )

    mock_dl = AsyncMock()
    mock_dl.update_thread.side_effect = Exception("DB error")

    session = WebsocketSession(
        id="ws_id",
        socket_id="socket_123",
        emit=AsyncMock(),
        emit_call=AsyncMock(),
        user_env={},
        client_type="webapp",
        thread_id="thread_abc",
    )
    session.has_first_interaction = True

    with patch("chainlit.data.get_data_layer", return_value=mock_dl):
        async with create_chainlit_context(session) as ctx:
            result = await cl.set_chat_profile("GPT-4")
            assert result is True
            ctx.emitter.emit.assert_called_once_with(
                "chat_profile_updated",
                {"chatProfile": "GPT-4", "ok": True},
            )
