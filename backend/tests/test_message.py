import uuid
from unittest.mock import AsyncMock, patch

import pytest

from chainlit.action import Action
from chainlit.element import Text
from chainlit.message import (
    AskActionMessage,
    AskFileMessage,
    AskUserMessage,
    ErrorMessage,
    Message,
)


@pytest.mark.asyncio
class TestMessageBase:
    """Test suite for the MessageBase class."""

    async def test_message_base_to_dict(self, mock_chainlit_context):
        """Test MessageBase.to_dict() serialization."""
        async with mock_chainlit_context as ctx:
            message = Message(content="Test content", author="Test Author")
            message.id = "test_id"
            message.thread_id = ctx.session.thread_id
            message.created_at = "2024-01-01T00:00:00Z"
            message.parent_id = "parent_id"
            message.command = "test_command"
            message.language = "python"
            message.metadata = {"key": "value"}
            message.tags = ["tag1", "tag2"]

            result = message.to_dict()

            assert result["id"] == "test_id"
            assert result["threadId"] == ctx.session.thread_id
            assert result["createdAt"] == "2024-01-01T00:00:00Z"
            assert result["parentId"] == "parent_id"
            assert result["command"] == "test_command"
            assert result["output"] == "Test content"
            assert result["name"] == "Test Author"
            assert result["type"] == "assistant_message"
            assert result["language"] == "python"
            assert result["metadata"] == {"key": "value"}
            assert result["tags"] == ["tag1", "tag2"]
            assert result["streaming"] is False
            assert result["isError"] is False
            assert result["waitForAnswer"] is False

    async def test_message_base_from_dict(self, mock_chainlit_context):
        """Test MessageBase.from_dict() deserialization."""
        async with mock_chainlit_context:
            step_dict = {
                "id": "test_id",
                "parentId": "parent_id",
                "createdAt": "2024-01-01T00:00:00Z",
                "output": "Test content",
                "name": "Test Author",
                "command": "test_command",
                "type": "assistant_message",
                "language": "python",
                "metadata": {"key": "value"},
            }

            message = Message.from_dict(step_dict)

            assert message.id == "test_id"
            assert message.parent_id == "parent_id"
            assert message.created_at == "2024-01-01T00:00:00Z"
            assert message.content == "Test content"
            assert message.author == "Test Author"
            assert message.command == "test_command"
            assert message.type == "assistant_message"
            assert message.language == "python"
            assert message.metadata == {"key": "value"}

    async def test_message_base_update(self, mock_chainlit_context):
        """Test MessageBase.update() method."""
        async with mock_chainlit_context as ctx:
            message = Message(content="Initial content")
            message.id = "test_id"
            message.streaming = True

            await message.update()

            # Verify streaming was set to False
            assert message.streaming is False

            # Verify emitter.update_step was called
            ctx.emitter.update_step.assert_called_once()
            call_args = ctx.emitter.update_step.call_args[0][0]
            assert call_args["id"] == "test_id"
            assert call_args["output"] == "Initial content"

    async def test_message_base_remove(self, mock_chainlit_context):
        """Test MessageBase.remove() method."""
        async with mock_chainlit_context as ctx:
            message = Message(content="Content to remove")
            message.id = "test_id"

            await message.remove()

            # Verify emitter.delete_step was called
            ctx.emitter.delete_step.assert_called_once()
            call_args = ctx.emitter.delete_step.call_args[0][0]
            assert call_args["id"] == "test_id"

    async def test_message_base_stream_token(self, mock_chainlit_context):
        """Test MessageBase.stream_token() method."""
        async with mock_chainlit_context as ctx:
            message = Message(content="")
            message.id = "test_id"

            # First token should start streaming
            await message.stream_token("Hello")
            assert message.streaming is True
            assert message.content == "Hello"
            ctx.emitter.stream_start.assert_called_once()

            # Subsequent tokens should just append
            await message.stream_token(" World")
            assert message.content == "Hello World"
            ctx.emitter.send_token.assert_called()

    async def test_message_base_stream_token_sequence(self, mock_chainlit_context):
        """Test MessageBase.stream_token() with is_sequence=True."""
        async with mock_chainlit_context as ctx:
            message = Message(content="Initial")
            message.id = "test_id"

            # Start streaming with first token
            await message.stream_token("First")
            assert message.streaming is True
            ctx.emitter.stream_start.assert_called_once()

            # Now send a sequence token - should call send_token
            await message.stream_token("Replaced", is_sequence=True)

            assert message.content == "Replaced"
            ctx.emitter.send_token.assert_called_with(
                id="test_id", token="Replaced", is_sequence=True
            )

    async def test_message_base_stream_token_empty(self, mock_chainlit_context):
        """Test MessageBase.stream_token() with empty token."""
        async with mock_chainlit_context as ctx:
            message = Message(content="")
            message.id = "test_id"

            await message.stream_token("")

            # Should not start streaming or send token for empty string
            ctx.emitter.stream_start.assert_not_called()


@pytest.mark.asyncio
class TestMessage:
    """Test suite for the Message class."""

    async def test_message_initialization_with_string_content(self):
        """Test Message initialization with string content."""
        message = Message(content="Hello, World!")

        assert message.content == "Hello, World!"
        assert message.author is not None
        assert isinstance(message.id, str)
        assert message.actions == []
        assert message.elements == []

    async def test_message_initialization_with_dict_content(self):
        """Test Message initialization with dict content."""
        content = {"key": "value", "number": 42}
        message = Message(content=content)

        assert message.language == "json"
        assert '"key": "value"' in message.content
        assert '"number": 42' in message.content

    async def test_message_initialization_with_all_params(self):
        """Test Message initialization with all parameters."""
        test_id = str(uuid.uuid4())
        actions = [Action(name="test_action", payload={})]
        message = Message(
            content="Test content",
            author="Custom Author",
            language="python",
            actions=actions,
            type="user_message",
            metadata={"key": "value"},
            tags=["tag1"],
            id=test_id,
            parent_id="parent_123",
            command="test_command",
            created_at="2024-01-01T00:00:00Z",
        )

        assert message.content == "Test content"
        assert message.author == "Custom Author"
        assert message.language == "python"
        assert len(message.actions) == 1
        assert message.type == "user_message"
        assert message.metadata == {"key": "value"}
        assert message.tags == ["tag1"]
        assert message.id == test_id
        assert message.parent_id == "parent_123"
        assert message.command == "test_command"
        assert message.created_at == "2024-01-01T00:00:00Z"

    async def test_message_send(self, mock_chainlit_context):
        """Test Message.send() method."""
        async with mock_chainlit_context as ctx:
            action = Action(name="test_action", payload={})
            message = Message(content="Test message", actions=[action])

            result = await message.send()

            # Verify message was sent
            assert result == message
            ctx.emitter.send_step.assert_called_once()

            # Verify action was sent
            assert action.forId == message.id
            ctx.emitter.emit.assert_called()

    async def test_message_update(self, mock_chainlit_context):
        """Test Message.update() method."""
        async with mock_chainlit_context as ctx:
            action = Action(name="test_action", payload={})
            message = Message(content="Initial content", actions=[action])
            message.id = "test_id"

            await message.update()

            # Verify update was called
            ctx.emitter.update_step.assert_called_once()

            # Verify action was sent if forId is None
            assert action.forId == message.id

    async def test_message_remove_actions(self, mock_chainlit_context):
        """Test Message.remove_actions() method."""
        async with mock_chainlit_context as ctx:
            action1 = Action(name="action1", payload={})
            action2 = Action(name="action2", payload={})
            message = Message(content="Test", actions=[action1, action2])
            action1.forId = "test_id"
            action2.forId = "test_id"

            await message.remove_actions()

            # Verify both actions were removed
            assert ctx.emitter.emit.call_count == 2
            calls = [call[0][0] for call in ctx.emitter.emit.call_args_list]
            assert "remove_action" in calls

    async def test_message_with_none_content(self, mock_chainlit_context):
        """Test Message handles None content."""
        async with mock_chainlit_context:
            message = Message(content=None)
            await message.send()

            assert message.content == ""

    async def test_message_with_dict_that_cant_json_serialize(self):
        """Test Message with dict that can't be JSON serialized."""
        # Create a dict with non-serializable content (like a function)
        content = {"key": lambda x: x}

        message = Message(content=content)

        # Should fall back to str() representation
        assert message.language == "text"
        assert isinstance(message.content, str)


@pytest.mark.asyncio
class TestErrorMessage:
    """Test suite for the ErrorMessage class."""

    async def test_error_message_initialization(self):
        """Test ErrorMessage initialization."""
        error = ErrorMessage(content="Something went wrong")

        assert error.content == "Something went wrong"
        assert error.is_error is True
        assert error.type == "assistant_message"
        assert isinstance(error.id, str)

    async def test_error_message_initialization_with_author(self):
        """Test ErrorMessage initialization with custom author."""
        error = ErrorMessage(content="Error occurred", author="System")

        assert error.content == "Error occurred"
        assert error.author == "System"
        assert error.is_error is True

    async def test_error_message_send(self, mock_chainlit_context):
        """Test ErrorMessage.send() method."""
        async with mock_chainlit_context as ctx:
            error = ErrorMessage(content="Test error")

            result = await error.send()

            # Verify error was sent
            assert result == error
            ctx.emitter.send_step.assert_called_once()
            call_args = ctx.emitter.send_step.call_args[0][0]
            assert call_args["isError"] is True
            assert call_args["output"] == "Test error"

    async def test_error_message_fail_on_persist_error(self, mock_chainlit_context):
        """Test ErrorMessage with fail_on_persist_error=True."""
        async with mock_chainlit_context:
            error = ErrorMessage(
                content="Test error", fail_on_persist_error=True
            )
            error.id = "test_id"

            # Mock data layer to raise an error
            with patch("chainlit.message.get_data_layer") as mock_get_dl:
                mock_dl = AsyncMock()
                mock_dl.create_step.side_effect = Exception("Persist error")
                mock_get_dl.return_value = mock_dl

                with pytest.raises(Exception, match="Persist error"):
                    await error.send()


@pytest.mark.asyncio
class TestAskUserMessage:
    """Test suite for the AskUserMessage class."""

    async def test_ask_user_message_initialization(self):
        """Test AskUserMessage initialization."""
        ask = AskUserMessage(content="What is your name?")

        assert ask.content == "What is your name?"
        assert ask.wait_for_answer is False
        assert ask.timeout == 60
        assert ask.raise_on_timeout is False

    async def test_ask_user_message_initialization_with_params(self):
        """Test AskUserMessage initialization with all parameters."""
        ask = AskUserMessage(
            content="Question?",
            author="Custom Author",
            type="user_message",
            timeout=120,
            raise_on_timeout=True,
        )

        assert ask.content == "Question?"
        assert ask.author == "Custom Author"
        assert ask.type == "user_message"
        assert ask.timeout == 120
        assert ask.raise_on_timeout is True

    async def test_ask_user_message_send(self, mock_chainlit_context):
        """Test AskUserMessage.send() method."""
        async with mock_chainlit_context as ctx:
            ask = AskUserMessage(content="What is your name?", timeout=30)

            # Mock the emitter's send_ask_user to return a response
            mock_response = {"id": "response_id", "content": "John Doe"}
            ctx.emitter.send_ask_user = AsyncMock(return_value=mock_response)

            result = await ask.send()

            # Verify wait_for_answer was set and then unset
            assert ask.wait_for_answer is False
            assert result == mock_response
            ctx.emitter.send_ask_user.assert_called_once()

    async def test_ask_user_message_remove(self, mock_chainlit_context):
        """Test AskUserMessage.remove() method."""
        async with mock_chainlit_context as ctx:
            ask = AskUserMessage(content="Question?")
            ask.id = "test_id"

            await ask.remove()

            # Verify clear_ask was called
            ctx.emitter.clear.assert_called_once_with("clear_ask")
            ctx.emitter.delete_step.assert_called_once()


@pytest.mark.asyncio
class TestAskFileMessage:
    """Test suite for the AskFileMessage class."""

    async def test_ask_file_message_initialization(self):
        """Test AskFileMessage initialization."""
        ask = AskFileMessage(content="Upload a file", accept=["text/plain"])

        assert ask.content == "Upload a file"
        assert ask.accept == ["text/plain"]
        assert ask.max_size_mb == 2
        assert ask.max_files == 1
        assert ask.timeout == 90

    async def test_ask_file_message_initialization_with_all_params(self):
        """Test AskFileMessage initialization with all parameters."""
        accept = {"text/plain": [".txt", ".py"]}
        ask = AskFileMessage(
            content="Upload files",
            accept=accept,
            max_size_mb=10,
            max_files=5,
            author="Custom Author",
            timeout=120,
            raise_on_timeout=True,
        )

        assert ask.content == "Upload files"
        assert ask.accept == accept
        assert ask.max_size_mb == 10
        assert ask.max_files == 5
        assert ask.author == "Custom Author"
        assert ask.timeout == 120
        assert ask.raise_on_timeout is True

    async def test_ask_file_message_send(self, mock_chainlit_context):
        """Test AskFileMessage.send() method."""
        async with mock_chainlit_context as ctx:
            ask = AskFileMessage(
                content="Upload a file", accept=["text/plain"], timeout=30
            )

            # Mock the emitter's send_ask_user to return file responses
            mock_response = [
                {
                    "id": "file1",
                    "name": "test.txt",
                    "path": "/path/to/test.txt",
                    "size": 1024,
                    "type": "text/plain",
                }
            ]
            ctx.emitter.send_ask_user = AsyncMock(return_value=mock_response)

            result = await ask.send()

            # Verify response was converted to AskFileResponse objects
            assert result is not None
            assert len(result) == 1
            assert result[0].id == "file1"
            assert result[0].name == "test.txt"
            assert result[0].path == "/path/to/test.txt"
            assert result[0].size == 1024
            assert result[0].type == "text/plain"

    async def test_ask_file_message_send_timeout(self, mock_chainlit_context):
        """Test AskFileMessage.send() with timeout (returns None)."""
        async with mock_chainlit_context as ctx:
            ask = AskFileMessage(content="Upload a file", accept=["text/plain"])

            # Mock timeout (returns None)
            ctx.emitter.send_ask_user = AsyncMock(return_value=None)

            result = await ask.send()

            assert result is None
            assert ask.wait_for_answer is False


@pytest.mark.asyncio
class TestAskActionMessage:
    """Test suite for the AskActionMessage class."""

    async def test_ask_action_message_initialization(self):
        """Test AskActionMessage initialization."""
        actions = [
            Action(name="action1", payload={"key": "value1"}),
            Action(name="action2", payload={"key": "value2"}),
        ]
        ask = AskActionMessage(content="Choose an action", actions=actions)

        assert ask.content == "Choose an action"
        assert len(ask.actions) == 2
        assert ask.timeout == 90
        assert ask.raise_on_timeout is False

    async def test_ask_action_message_send(self, mock_chainlit_context):
        """Test AskActionMessage.send() method."""
        async with mock_chainlit_context as ctx:
            actions = [
                Action(name="action1", payload={}, label="Action 1"),
                Action(name="action2", payload={}, label="Action 2"),
            ]
            ask = AskActionMessage(content="Choose", actions=actions)

            # Mock the emitter's send_ask_user to return a response
            mock_response = {"name": "action1", "label": "Action 1", "payload": {}}
            ctx.emitter.send_ask_user = AsyncMock(return_value=mock_response)

            result = await ask.send()

            # Verify actions were sent and then removed
            assert result == mock_response
            assert ask.content == "**Selected:** Action 1"
            assert ask.wait_for_answer is False

            # Verify actions were sent
            assert ctx.emitter.emit.call_count >= 2

            # Verify actions were removed
            remove_calls = [
                call[0][0] for call in ctx.emitter.emit.call_args_list
            ]
            assert "remove_action" in remove_calls

    async def test_ask_action_message_send_timeout(self, mock_chainlit_context):
        """Test AskActionMessage.send() with timeout."""
        async with mock_chainlit_context as ctx:
            actions = [Action(name="action1", payload={})]
            ask = AskActionMessage(content="Choose", actions=actions)

            # Mock timeout (returns None)
            ctx.emitter.send_ask_user = AsyncMock(return_value=None)

            result = await ask.send()

            assert result is None
            assert ask.content == "Timed out: no action was taken"
            assert ask.wait_for_answer is False

            # Verify update was called
            ctx.emitter.update_step.assert_called()


@pytest.mark.asyncio
class TestMessageIntegration:
    """Integration tests for Message classes."""

    async def test_message_with_actions_and_elements(self, mock_chainlit_context):
        """Test Message with both actions and elements."""
        async with mock_chainlit_context as ctx:

            action = Action(name="test_action", payload={})
            element = Text(name="test_element", content="Element content")
            message = Message(
                content="Test message", actions=[action], elements=[element]
            )

            await message.send()

            # Verify both action and element were sent
            assert action.forId == message.id
            # Element sending is verified through emitter calls
            assert ctx.emitter.emit.call_count >= 2

    async def test_message_update_with_existing_actions(self, mock_chainlit_context):
        """Test Message.update() with actions that already have forId."""
        async with mock_chainlit_context as ctx:
            action1 = Action(name="action1", payload={})
            action2 = Action(name="action2", payload={})
            message = Message(content="Test", actions=[action1, action2])
            message.id = "test_id"

            # Set forId on one action
            action1.forId = "test_id"

            await message.update()

            # action1 should not be sent again (already has forId)
            # action2 should be sent
            emit_calls = ctx.emitter.emit.call_args_list
            action_calls = [call for call in emit_calls if call[0][0] == "action"]
            # Should have at least one action call (for action2)
            assert len(action_calls) >= 1

