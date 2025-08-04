from unittest.mock import MagicMock

import pytest

from chainlit.element import ElementDict
from chainlit.emitter import ChainlitEmitter
from chainlit.step import StepDict


@pytest.fixture
def emitter(mock_websocket_session):
    return ChainlitEmitter(mock_websocket_session)


async def test_send_element(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    element_dict: ElementDict = {
        "id": "test_element",
        "threadId": None,
        "type": "text",
        "chainlitKey": None,
        "url": None,
        "objectKey": None,
        "name": "Test Element",
        "display": "inline",
        "size": None,
        "language": None,
        "page": None,
        "props": None,
        "autoPlay": None,
        "playerConfig": None,
        "forId": None,
        "mime": None,
    }

    await emitter.send_element(element_dict)

    mock_websocket_session.emit.assert_called_once_with("element", element_dict)


async def test_send_step(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    step_dict: StepDict = {
        "id": "test_step",
        "type": "user_message",
        "name": "Test Step",
        "output": "This is a test step",
    }

    await emitter.send_step(step_dict)

    mock_websocket_session.emit.assert_called_once_with("new_message", step_dict)


async def test_update_step(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    step_dict: StepDict = {
        "id": "test_step",
        "type": "assistant_message",
        "name": "Updated Test Step",
        "output": "This is an updated test step",
    }

    await emitter.update_step(step_dict)

    mock_websocket_session.emit.assert_called_once_with("update_message", step_dict)


async def test_delete_step(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    step_dict: StepDict = {
        "id": "test_step",
        "type": "system_message",
        "name": "Deleted Test Step",
        "output": "This step will be deleted",
    }

    await emitter.delete_step(step_dict)

    mock_websocket_session.emit.assert_called_once_with("delete_message", step_dict)


async def test_send_timeout(emitter, mock_websocket_session):
    await emitter.send_timeout("ask_timeout")
    mock_websocket_session.emit.assert_called_once_with("ask_timeout", {})


async def test_clear(emitter, mock_websocket_session):
    await emitter.clear("clear_ask")
    mock_websocket_session.emit.assert_called_once_with("clear_ask", {})


async def test_send_token(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    await emitter.send_token("test_id", "test_token", is_sequence=True, is_input=False)
    mock_websocket_session.emit.assert_called_once_with(
        "stream_token",
        {"id": "test_id", "token": "test_token", "isSequence": True, "isInput": False},
    )


async def test_set_chat_settings(emitter, mock_websocket_session):
    settings = {"key": "value"}
    emitter.set_chat_settings(settings)
    assert emitter.session.chat_settings == settings


async def test_update_token_count(emitter, mock_websocket_session):
    count = 100
    await emitter.update_token_count(count)
    mock_websocket_session.emit.assert_called_once_with("token_usage", count)


async def test_task_start(emitter, mock_websocket_session):
    await emitter.task_start()
    mock_websocket_session.emit.assert_called_once_with("task_start", {})


async def test_task_end(emitter, mock_websocket_session):
    await emitter.task_end()
    mock_websocket_session.emit.assert_called_once_with("task_end", {})


async def test_stream_start(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    step_dict: StepDict = {
        "id": "test_stream",
        "type": "run",
        "name": "Test Stream",
        "output": "This is a test stream",
    }
    await emitter.stream_start(step_dict)
    mock_websocket_session.emit.assert_called_once_with("stream_start", step_dict)


async def test_send_toast(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    message = "This is a test message"
    await emitter.send_toast(message)
    mock_websocket_session.emit.assert_called_once_with(
        "toast", {"message": message, "type": "info"}
    )


async def test_send_toast_with_type(
    emitter: ChainlitEmitter, mock_websocket_session: MagicMock
) -> None:
    message = "This is a test message"
    await emitter.send_toast(message, type="error")
    mock_websocket_session.emit.assert_called_once_with(
        "toast", {"message": message, "type": "error"}
    )


async def test_send_toast_invalid_type(emitter: ChainlitEmitter) -> None:
    message = "This is a test message"
    with pytest.raises(ValueError, match="Invalid toast type: invalid"):
        await emitter.send_toast(message, type="invalid")  # type: ignore[arg-type]
