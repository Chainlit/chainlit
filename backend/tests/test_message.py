import asyncio
import json
from contextlib import contextmanager
from unittest.mock import AsyncMock, Mock, patch

import pytest

from chainlit.action import Action
from chainlit.context import ChainlitContext, context_var
from chainlit.message import (
    AskActionMessage,
    AskElementMessage,
    AskFileMessage,
    AskUserMessage,
    ErrorMessage,
    Message,
    MessageBase,
)


@contextmanager
def mock_chainlit_context(session=None):
    """Context manager to set up and tear down Chainlit context."""
    mock_loop = Mock(spec=asyncio.AbstractEventLoop)
    mock_session = session or Mock()
    mock_session.thread_id = "thread_123"

    with patch("asyncio.get_running_loop", return_value=mock_loop):
        mock_emitter = AsyncMock()
        mock_context = ChainlitContext(session=mock_session, emitter=mock_emitter)
        token = context_var.set(mock_context)
        try:
            yield mock_context
        finally:
            context_var.reset(token)


class TestMessageBase:
    """Test suite for MessageBase class."""

    def test_post_init_sets_thread_id(self):
        """Test that __post_init__ sets thread_id from session."""
        with mock_chainlit_context():
            msg = Message(content="test")
            assert msg.thread_id == "thread_123"

    def test_post_init_generates_id_if_not_provided(self):
        """Test that __post_init__ generates UUID if id not provided."""
        with mock_chainlit_context():
            msg = Message(content="test")
            assert msg.id is not None
            assert len(msg.id) == 36

    def test_post_init_uses_provided_id(self):
        """Test that __post_init__ uses provided id."""
        with mock_chainlit_context():
            msg = Message(content="test", id="custom_id")
            assert msg.id == "custom_id"

    def test_from_dict_creates_message(self):
        """Test creating message from dictionary."""
        step_dict = {
            "id": "msg_123",
            "parentId": "parent_123",
            "createdAt": "2024-01-01T00:00:00Z",
            "output": "Hello world",
            "name": "Assistant",
            "command": "/test",
            "type": "user_message",
            "language": "python",
            "metadata": {"key": "value"},
        }

        with mock_chainlit_context():
            msg = MessageBase.from_dict(step_dict)

            assert msg.id == "msg_123"
            assert msg.parent_id == "parent_123"
            assert msg.created_at == "2024-01-01T00:00:00Z"
            assert msg.content == "Hello world"
            assert msg.author == "Assistant"
            assert msg.command == "/test"
            assert msg.type == "user_message"
            assert msg.language == "python"
            assert msg.metadata == {"key": "value"}

    def test_from_dict_with_minimal_data(self):
        """Test from_dict with minimal required fields."""
        step_dict = {
            "id": "msg_123",
            "createdAt": "2024-01-01T00:00:00Z",
            "output": "Hello",
        }

        with mock_chainlit_context():
            with patch("chainlit.message.config") as mock_config:
                mock_config.ui.name = "DefaultBot"
                msg = MessageBase.from_dict(step_dict)

                assert msg.id == "msg_123"
                assert msg.content == "Hello"
                assert msg.author == "DefaultBot"
                assert msg.type == "assistant_message"

    def test_to_dict_returns_step_dict(self):
        """Test converting message to dictionary."""
        with mock_chainlit_context():
            msg = Message(
                content="Test content",
                author="TestBot",
                language="python",
                type="user_message",
                metadata={"key": "value"},
                tags=["tag1", "tag2"],
                id="msg_123",
                parent_id="parent_123",
                command="/test",
            )
            msg.created_at = "2024-01-01T00:00:00Z"

            result = msg.to_dict()

            assert result["id"] == "msg_123"
            assert result["threadId"] == "thread_123"
            assert result["parentId"] == "parent_123"
            assert result["createdAt"] == "2024-01-01T00:00:00Z"
            assert result["command"] == "/test"
            assert result["output"] == "Test content"
            assert result["name"] == "TestBot"
            assert result["type"] == "user_message"
            assert result["language"] == "python"
            assert result["streaming"] is False
            assert result["isError"] is False
            assert result["waitForAnswer"] is False
            assert result["metadata"] == {"key": "value"}
            assert result["tags"] == ["tag1", "tag2"]

    @pytest.mark.asyncio
    async def test_update_stops_streaming(self):
        """Test that update stops streaming."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="test")
            msg.streaming = True

            with patch("chainlit.message.chat_context") as mock_chat_ctx:
                with patch("chainlit.message.get_data_layer", return_value=None):
                    result = await msg.update()

                    assert msg.streaming is False
                    assert result is True
                    mock_chat_ctx.add.assert_called_once_with(msg)
                    ctx.emitter.update_step.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_with_data_layer(self):
        """Test update with data layer."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="test")
            mock_data_layer = AsyncMock()

            with patch("chainlit.message.chat_context"):
                with patch(
                    "chainlit.message.get_data_layer", return_value=mock_data_layer
                ):
                    with patch("asyncio.create_task") as mock_create_task:
                        await msg.update()

                        mock_create_task.assert_called_once()
                        ctx.emitter.update_step.assert_called_once()

    @pytest.mark.asyncio
    async def test_remove_from_chat_context(self):
        """Test removing message from chat context."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="test", id="msg_123")

            with patch("chainlit.message.chat_context") as mock_chat_ctx:
                with patch("chainlit.message.get_data_layer", return_value=None):
                    result = await msg.remove()

                    assert result is True
                    mock_chat_ctx.remove.assert_called_once_with(msg)
                    ctx.emitter.delete_step.assert_called_once()


class TestMessage:
    """Test suite for Message class."""

    def test_message_with_string_content(self):
        """Test creating message with string content."""
        with mock_chainlit_context():
            msg = Message(content="Hello world")

            assert msg.content == "Hello world"
            assert msg.language is None

    def test_message_with_dict_content(self):
        """Test creating message with dict content."""
        with mock_chainlit_context():
            content_dict = {"key": "value", "number": 42}
            msg = Message(content=content_dict)

            expected = json.dumps(content_dict, indent=4, ensure_ascii=False)
            assert msg.content == expected
            assert msg.language == "json"

    def test_message_with_non_serializable_dict(self):
        """Test message with non-JSON-serializable dict."""
        with mock_chainlit_context():

            class NonSerializable:
                pass

            content_dict = {"obj": NonSerializable()}
            msg = Message(content=content_dict)

            assert msg.language == "text"
            assert "NonSerializable" in msg.content

    def test_message_with_non_string_content(self):
        """Test message with non-string, non-dict content."""
        with mock_chainlit_context():
            msg = Message(content=12345)

            assert msg.content == "12345"
            assert msg.language == "text"

    def test_message_with_custom_author(self):
        """Test message with custom author."""
        with mock_chainlit_context():
            msg = Message(content="test", author="CustomBot")

            assert msg.author == "CustomBot"

    def test_message_with_default_author(self):
        """Test message uses default author from config."""
        with mock_chainlit_context():
            with patch("chainlit.message.config") as mock_config:
                mock_config.ui.name = "DefaultBot"
                msg = Message(content="test")

                assert msg.author == "DefaultBot"

    def test_message_with_actions(self):
        """Test message with actions."""
        with mock_chainlit_context():
            action1 = Mock(spec=Action)
            action2 = Mock(spec=Action)
            msg = Message(content="test", actions=[action1, action2])

            assert len(msg.actions) == 2
            assert action1 in msg.actions
            assert action2 in msg.actions

    def test_message_with_elements(self):
        """Test message with elements."""
        with mock_chainlit_context():
            element1 = Mock()
            element2 = Mock()
            msg = Message(content="test", elements=[element1, element2])

            assert len(msg.elements) == 2
            assert element1 in msg.elements
            assert element2 in msg.elements

    @pytest.mark.asyncio
    async def test_message_send(self):
        """Test sending a message."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="test")

            with patch("chainlit.message.chat_context") as mock_chat_ctx:
                with patch("chainlit.message.get_data_layer", return_value=None):
                    with patch("chainlit.message.config") as mock_config:
                        mock_config.code.author_rename = None

                        result = await msg.send()

                        assert result == msg
                        assert msg.created_at is not None
                        assert msg.streaming is False
                        mock_chat_ctx.add.assert_called_once_with(msg)
                        ctx.emitter.send_step.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_send_with_author_rename(self):
        """Test sending message with author rename."""
        with mock_chainlit_context():
            msg = Message(content="test", author="OldName")

            async def rename_author(name):
                return "NewName"

            with patch("chainlit.message.chat_context"):
                with patch("chainlit.message.get_data_layer", return_value=None):
                    with patch("chainlit.message.config") as mock_config:
                        mock_config.code.author_rename = rename_author

                        await msg.send()

                        assert msg.author == "NewName"

    @pytest.mark.asyncio
    async def test_message_send_with_actions_and_elements(self):
        """Test sending message with actions and elements."""
        with mock_chainlit_context():
            action = AsyncMock(spec=Action)
            element = AsyncMock()
            msg = Message(content="test", actions=[action], elements=[element])

            with patch("chainlit.message.chat_context"):
                with patch("chainlit.message.get_data_layer", return_value=None):
                    with patch("chainlit.message.config") as mock_config:
                        mock_config.code.author_rename = None

                        await msg.send()

                        action.send.assert_called_once()
                        element.send.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_update_with_actions(self):
        """Test updating message with new actions."""
        with mock_chainlit_context():
            action1 = AsyncMock(spec=Action)
            action1.forId = None
            action2 = AsyncMock(spec=Action)
            action2.forId = "existing_id"

            msg = Message(content="test", actions=[action1, action2])

            with patch("chainlit.message.chat_context"):
                with patch("chainlit.message.get_data_layer", return_value=None):
                    result = await msg.update()

                    assert result is True
                    action1.send.assert_called_once()
                    action2.send.assert_not_called()

    @pytest.mark.asyncio
    async def test_message_remove_actions(self):
        """Test removing all actions from message."""
        with mock_chainlit_context():
            action1 = AsyncMock(spec=Action)
            action2 = AsyncMock(spec=Action)
            msg = Message(content="test", actions=[action1, action2])

            await msg.remove_actions()

            action1.remove.assert_called_once()
            action2.remove.assert_called_once()

    @pytest.mark.asyncio
    async def test_stream_token_starts_streaming(self):
        """Test that stream_token starts streaming."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="")

            await msg.stream_token("Hello")

            assert msg.streaming is True
            assert msg.content == "Hello"
            ctx.emitter.stream_start.assert_called_once()

    @pytest.mark.asyncio
    async def test_stream_token_appends_content(self):
        """Test that stream_token appends to content."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="Hello")
            msg.streaming = True

            await msg.stream_token(" world")

            assert msg.content == "Hello world"
            ctx.emitter.send_token.assert_called_once_with(
                id=msg.id, token=" world", is_sequence=False
            )

    @pytest.mark.asyncio
    async def test_stream_token_with_sequence(self):
        """Test stream_token with is_sequence=True."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="Old content")
            msg.streaming = True

            await msg.stream_token("New content", is_sequence=True)

            assert msg.content == "New content"
            ctx.emitter.send_token.assert_called_once_with(
                id=msg.id, token="New content", is_sequence=True
            )

    @pytest.mark.asyncio
    async def test_stream_token_ignores_empty_token(self):
        """Test that empty tokens are ignored."""
        with mock_chainlit_context() as ctx:
            msg = Message(content="test")

            await msg.stream_token("")

            assert msg.content == "test"
            ctx.emitter.stream_start.assert_not_called()


class TestErrorMessage:
    """Test suite for ErrorMessage class."""

    def test_error_message_initialization(self):
        """Test ErrorMessage initialization."""
        with mock_chainlit_context():
            msg = ErrorMessage(content="An error occurred")

            assert msg.content == "An error occurred"
            assert msg.author is not None
            assert msg.type == "assistant_message"
            assert msg.is_error is True
            assert msg.fail_on_persist_error is False

    def test_error_message_with_custom_author(self):
        """Test ErrorMessage with custom author."""
        with mock_chainlit_context():
            msg = ErrorMessage(content="Error", author="ErrorBot")

            assert msg.author == "ErrorBot"

    def test_error_message_with_fail_on_persist(self):
        """Test ErrorMessage with fail_on_persist_error=True."""
        with mock_chainlit_context():
            msg = ErrorMessage(content="Error", fail_on_persist_error=True)

            assert msg.fail_on_persist_error is True

    @pytest.mark.asyncio
    async def test_error_message_send(self):
        """Test sending error message."""
        with mock_chainlit_context() as ctx:
            msg = ErrorMessage(content="Error occurred")

            with patch("chainlit.message.chat_context"):
                with patch("chainlit.message.get_data_layer", return_value=None):
                    with patch("chainlit.message.config") as mock_config:
                        mock_config.code.author_rename = None

                        result = await msg.send()

                        assert result == msg
                        ctx.emitter.send_step.assert_called_once()


class TestAskUserMessage:
    """Test suite for AskUserMessage class."""

    def test_ask_user_message_initialization(self):
        """Test AskUserMessage initialization."""
        with mock_chainlit_context():
            msg = AskUserMessage(content="What is your name?")

            assert msg.content == "What is your name?"
            assert msg.author is not None
            assert msg.timeout == 60
            assert msg.raise_on_timeout is False

    def test_ask_user_message_with_custom_timeout(self):
        """Test AskUserMessage with custom timeout."""
        with mock_chainlit_context():
            msg = AskUserMessage(content="Question?", timeout=120)

            assert msg.timeout == 120

    @pytest.mark.asyncio
    async def test_ask_user_message_send(self):
        """Test sending AskUserMessage."""
        with mock_chainlit_context() as ctx:
            msg = AskUserMessage(content="Question?")
            ctx.emitter.send_ask_user = AsyncMock(return_value={"output": "Answer"})

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    result = await msg.send()

                    assert result == {"output": "Answer"}
                    assert msg.wait_for_answer is False
                    ctx.emitter.send_ask_user.assert_called_once()


class TestAskFileMessage:
    """Test suite for AskFileMessage class."""

    def test_ask_file_message_initialization(self):
        """Test AskFileMessage initialization."""
        with mock_chainlit_context():
            with patch("chainlit.message.config") as mock_config:
                mock_config.ui.name = "Bot"
                msg = AskFileMessage(
                    content="Upload a file", accept=["text/plain", "application/pdf"]
                )

                assert msg.content == "Upload a file"
                assert msg.accept == ["text/plain", "application/pdf"]
                assert msg.max_size_mb == 2
                assert msg.max_files == 1

    def test_ask_file_message_with_custom_limits(self):
        """Test AskFileMessage with custom limits."""
        with mock_chainlit_context():
            msg = AskFileMessage(
                content="Upload", accept=["image/*"], max_size_mb=10, max_files=5
            )

            assert msg.max_size_mb == 10
            assert msg.max_files == 5

    @pytest.mark.asyncio
    async def test_ask_file_message_send_with_response(self):
        """Test AskFileMessage send with file response."""
        with mock_chainlit_context() as ctx:
            msg = AskFileMessage(content="Upload", accept=["text/plain"])
            file_response = [
                {
                    "id": "file_123",
                    "name": "test.txt",
                    "path": "/path/to/test.txt",
                    "size": 1024,
                    "type": "text/plain",
                }
            ]
            ctx.emitter.send_ask_user = AsyncMock(return_value=file_response)

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    result = await msg.send()

                    assert result is not None
                    assert len(result) == 1
                    assert result[0].id == "file_123"
                    assert result[0].name == "test.txt"
                    assert result[0].path == "/path/to/test.txt"

    @pytest.mark.asyncio
    async def test_ask_file_message_send_with_no_response(self):
        """Test AskFileMessage send with no response."""
        with mock_chainlit_context() as ctx:
            msg = AskFileMessage(content="Upload", accept=["text/plain"])
            ctx.emitter.send_ask_user = AsyncMock(return_value=None)

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    result = await msg.send()

                    assert result is None


class TestAskActionMessage:
    """Test suite for AskActionMessage class."""

    def test_ask_action_message_initialization(self):
        """Test AskActionMessage initialization."""
        with mock_chainlit_context():
            with patch("chainlit.message.config") as mock_config:
                mock_config.ui.name = "Bot"
                action1 = Mock(spec=Action)
                action2 = Mock(spec=Action)
                msg = AskActionMessage(
                    content="Choose an action", actions=[action1, action2]
                )

                assert msg.content == "Choose an action"
                assert len(msg.actions) == 2

    @pytest.mark.asyncio
    async def test_ask_action_message_send_with_response(self):
        """Test AskActionMessage send with action response."""
        with mock_chainlit_context() as ctx:
            action = AsyncMock(spec=Action)
            action.id = "action_123"
            msg = AskActionMessage(content="Choose", actions=[action])
            ctx.emitter.send_ask_user = AsyncMock(
                return_value={"id": "action_123", "label": "Confirm"}
            )

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    with patch("chainlit.message.chat_context"):
                        result = await msg.send()

                        assert result == {"id": "action_123", "label": "Confirm"}
                        assert msg.content == "**Selected:** Confirm"
                        action.send.assert_called_once()
                        action.remove.assert_called_once()

    @pytest.mark.asyncio
    async def test_ask_action_message_send_timeout(self):
        """Test AskActionMessage send with timeout."""
        with mock_chainlit_context() as ctx:
            action = AsyncMock(spec=Action)
            action.id = "action_123"
            msg = AskActionMessage(content="Choose", actions=[action])
            ctx.emitter.send_ask_user = AsyncMock(return_value=None)

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    with patch("chainlit.message.chat_context"):
                        result = await msg.send()

                        assert result is None
                        assert msg.content == "Timed out: no action was taken"


class TestAskElementMessage:
    """Test suite for AskElementMessage class."""

    def test_ask_element_message_initialization(self):
        """Test AskElementMessage initialization."""
        with mock_chainlit_context():
            with patch("chainlit.message.config") as mock_config:
                mock_config.ui.name = "Bot"
                element = Mock()
                msg = AskElementMessage(content="Submit form", element=element)

                assert msg.content == "Submit form"
                assert msg.element == element

    @pytest.mark.asyncio
    async def test_ask_element_message_send_submitted(self):
        """Test AskElementMessage send with submitted response."""
        with mock_chainlit_context() as ctx:
            element = AsyncMock()
            element.id = "element_123"
            msg = AskElementMessage(content="Submit", element=element)
            ctx.emitter.send_ask_user = AsyncMock(
                return_value={"submitted": True, "data": {"field": "value"}}
            )

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    with patch("chainlit.message.chat_context"):
                        result = await msg.send()

                        assert result == {"submitted": True, "data": {"field": "value"}}
                        assert msg.content == "Thanks for submitting"
                        element.send.assert_called_once()
                        element.remove.assert_called_once()

    @pytest.mark.asyncio
    async def test_ask_element_message_send_cancelled(self):
        """Test AskElementMessage send with cancelled response."""
        with mock_chainlit_context() as ctx:
            element = AsyncMock()
            element.id = "element_123"
            msg = AskElementMessage(content="Submit", element=element)
            ctx.emitter.send_ask_user = AsyncMock(return_value={"submitted": False})

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    with patch("chainlit.message.chat_context"):
                        result = await msg.send()

                        assert result == {"submitted": False}
                        assert msg.content == "Cancelled"

    @pytest.mark.asyncio
    async def test_ask_element_message_send_timeout(self):
        """Test AskElementMessage send with timeout."""
        with mock_chainlit_context() as ctx:
            element = AsyncMock()
            element.id = "element_123"
            msg = AskElementMessage(content="Submit", element=element)
            ctx.emitter.send_ask_user = AsyncMock(return_value=None)

            with patch("chainlit.message.get_data_layer", return_value=None):
                with patch("chainlit.message.config") as mock_config:
                    mock_config.code.author_rename = None

                    with patch("chainlit.message.chat_context"):
                        result = await msg.send()

                        assert result is None
                        assert msg.content == "Timed out"


class TestMessageEdgeCases:
    """Test suite for message edge cases."""

    def test_message_with_none_content(self):
        """Test message handles None content."""
        with mock_chainlit_context():
            msg = Message(content=None)
            assert msg.content == "None"

    def test_message_language_override(self):
        """Test that dict content sets language to json."""
        with mock_chainlit_context():
            msg = Message(content={"key": "value"}, language="python")
            # Dict content always sets language to json, overriding the parameter
            assert msg.language == "json"

    @pytest.mark.asyncio
    async def test_message_send_with_none_content(self):
        """Test sending message with None content."""
        with mock_chainlit_context():
            msg = Message(content="test")
            msg.content = None

            with patch("chainlit.message.chat_context"):
                with patch("chainlit.message.get_data_layer", return_value=None):
                    with patch("chainlit.message.config") as mock_config:
                        mock_config.code.author_rename = None

                        await msg.send()

                        assert msg.content == ""

    @pytest.mark.asyncio
    async def test_ask_message_remove_clears_ask(self):
        """Test that AskMessage remove clears ask state."""
        with mock_chainlit_context() as ctx:
            msg = AskUserMessage(content="Question?")

            with patch("chainlit.message.chat_context"):
                with patch("chainlit.message.get_data_layer", return_value=None):
                    await msg.remove()

                    ctx.emitter.clear.assert_called_once_with("clear_ask")

    def test_message_metadata_and_tags(self):
        """Test message with metadata and tags."""
        with mock_chainlit_context():
            metadata = {"key1": "value1", "key2": 123}
            tags = ["important", "user-query"]
            msg = Message(content="test", metadata=metadata, tags=tags)

            assert msg.metadata == metadata
            assert msg.tags == tags

    def test_message_to_dict_with_none_metadata(self):
        """Test to_dict with None metadata."""
        with mock_chainlit_context():
            msg = Message(content="test")
            msg.metadata = None

            result = msg.to_dict()

            assert result["metadata"] == {}
