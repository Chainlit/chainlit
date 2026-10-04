from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

import chainlit.socket as socket
from chainlit.types import ChatProfile
from chainlit.user_session import user_sessions


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "profiles", [None, [], [ChatProfile(name="new", markdown_description="New")]]
)
async def test_unavailable_profile_does_not_restore_session(monkeypatch, profiles):
    session = SimpleNamespace(
        id="profile-test",
        user=SimpleNamespace(identifier="owner"),
        thread_id_to_resume="thread",
        chat_profile="new",
        language="en-US",
    )
    metadata = {"chat_profile": "deleted", "chat_settings": {"temperature": 0.4}}
    thread = {"id": "thread", "userIdentifier": "owner", "metadata": metadata}
    layer = SimpleNamespace(get_thread=AsyncMock(return_value=thread))
    monkeypatch.setattr(socket, "get_data_layer", lambda: layer)
    monkeypatch.setattr(
        socket.config.code, "set_chat_profiles", AsyncMock(return_value=profiles)
    )
    original = user_sessions.copy()
    try:
        with pytest.raises(ValueError, match="no longer available"):
            await socket.resume_thread(session)
        assert session.chat_profile == "new"
        assert user_sessions == original
        assert thread["metadata"] == metadata
    finally:
        user_sessions.clear()
        user_sessions.update(original)


@pytest.mark.asyncio
async def test_unauthorized_thread_does_not_query_profiles(monkeypatch):
    session = SimpleNamespace(
        user=SimpleNamespace(identifier="other"), thread_id_to_resume="thread"
    )
    layer = SimpleNamespace(
        get_thread=AsyncMock(
            return_value={
                "userIdentifier": "owner",
                "metadata": {"chat_profile": "deleted"},
            }
        )
    )
    profiles = AsyncMock()
    monkeypatch.setattr(socket, "get_data_layer", lambda: layer)
    monkeypatch.setattr(socket.config.code, "set_chat_profiles", profiles)
    assert await socket.resume_thread(session) is None
    profiles.assert_not_called()


@pytest.mark.asyncio
async def test_unavailable_profile_emits_readonly_state_without_app_callbacks(
    monkeypatch,
):
    session = SimpleNamespace(
        id="readonly-test",
        user=SimpleNamespace(identifier="owner"),
        thread_id_to_resume="thread",
        chat_profile="new",
        language="en-US",
        restored=False,
        unavailable_chat_profile=None,
    )
    emitter = AsyncMock()
    context = SimpleNamespace(session=session, emitter=emitter)
    layer = SimpleNamespace(
        get_thread=AsyncMock(
            return_value={
                "id": "thread",
                "userIdentifier": "owner",
                "metadata": {"chat_profile": "deleted"},
            }
        )
    )
    resume = AsyncMock()
    start = AsyncMock()
    monkeypatch.setattr(socket, "init_ws_context", lambda _: context)
    monkeypatch.setattr(socket, "get_data_layer", lambda: layer)
    monkeypatch.setattr(
        socket.config.code, "set_chat_profiles", AsyncMock(return_value=[])
    )
    monkeypatch.setattr(socket.config.code, "on_chat_resume", resume)
    monkeypatch.setattr(socket.config.code, "on_chat_start", start)
    await socket.connection_successful("sid")
    await socket.connection_successful("sid")
    resume.assert_not_called()
    start.assert_not_called()
    assert emitter.emit.await_count == 2
    for call in emitter.emit.await_args_list:
        assert call.args[0] == "resume_thread_unavailable"
        assert call.args[1]["thread_id"] == "thread"
    assert session.chat_profile == "new"
    assert session.id not in user_sessions
    await socket.process_message(session, {})
    resume.assert_not_called()


@pytest.mark.asyncio
async def test_readonly_disconnect_does_not_persist_over_old_thread(monkeypatch):
    session = SimpleNamespace(
        id="readonly-disconnect",
        thread_id="thread",
        has_first_interaction=True,
        unavailable_chat_profile="Deleted profile",
        to_clear=True,
        delete=AsyncMock(),
    )
    persist = AsyncMock()
    end = AsyncMock()
    monkeypatch.setattr(socket.WebsocketSession, "get", lambda _: session)
    monkeypatch.setattr(socket, "init_ws_context", lambda _: None)
    monkeypatch.setattr(socket, "persist_user_session", persist)
    monkeypatch.setattr(socket.config.code, "on_chat_end", end)
    await socket.disconnect("sid")
    persist.assert_not_called()
    end.assert_not_called()
    session.delete.assert_awaited_once()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("handler", "args"),
    [
        ("stop", ()),
        ("message", ({},)),
        ("edit_message", ({},)),
        ("message_favorite", ({},)),
        ("window_message", ({},)),
        ("audio_start", ()),
        ("audio_chunk", ({},)),
        ("audio_end", ()),
        ("change_settings", ({"temperature": 1},)),
        ("edit_settings", ({"temperature": 1},)),
    ],
)
async def test_readonly_session_rejects_mutating_events(
    monkeypatch, mock_session_factory, handler, args
):
    session = mock_session_factory(unavailable_chat_profile="Deleted profile")
    session.current_task = None
    init = Mock()
    monkeypatch.setattr(socket.WebsocketSession, "get", lambda _: session)
    monkeypatch.setattr(socket.WebsocketSession, "require", lambda _: session)
    monkeypatch.setattr(socket, "init_ws_context", init)
    await getattr(socket, handler)("sid", *args)
    init.assert_not_called()
    assert session.current_task is None
    assert session.chat_settings == {}


def test_mock_session_factory_preserves_unavailable_profile(mock_session_factory):
    assert mock_session_factory().unavailable_chat_profile is None
    assert (
        mock_session_factory(
            unavailable_chat_profile="Deleted profile"
        ).unavailable_chat_profile
        == "Deleted profile"
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("unavailable", "owns_session", "status"),
    [(True, True, 409), (True, False, 401), (False, True, 200)],
)
async def test_http_action_respects_readonly_and_ownership(
    monkeypatch, mock_session_factory, unavailable, owns_session, status
):
    import importlib

    from fastapi import HTTPException

    from chainlit.server import call_action
    from chainlit.types import CallActionRequest

    session = mock_session_factory(
        unavailable_chat_profile="Deleted profile" if unavailable else None
    )
    callback = AsyncMock(return_value="ok")
    session.get_config.return_value = SimpleNamespace(
        code=SimpleNamespace(action_callbacks={"test": callback})
    )
    monkeypatch.setattr(socket.WebsocketSession, "get_by_id", lambda _: session)
    context_module = importlib.import_module("chainlit.context")
    monkeypatch.setattr(
        context_module, "init_ws_context", lambda _: SimpleNamespace(session=session)
    )
    payload = CallActionRequest(
        sessionId=session.id, action={"name": "test", "payload": {}}
    )
    user = session.user if owns_session else SimpleNamespace(identifier="other")
    if status == 200:
        response = await call_action(payload, user)
        assert response.status_code == 200
        callback.assert_awaited_once()
    else:
        with pytest.raises(HTTPException) as error:
            await call_action(payload, user)
        assert error.value.status_code == status
        callback.assert_not_called()
