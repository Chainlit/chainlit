import asyncio
from contextlib import contextmanager
from unittest.mock import Mock, patch

from chainlit.chat_context import chat_context, chat_contexts
from chainlit.context import ChainlitContext, context_var


@contextmanager
def mock_chainlit_context(session=None):
    """Context manager to set up and tear down Chainlit context."""
    # Mock the event loop since we're not in an async context
    mock_loop = Mock(spec=asyncio.AbstractEventLoop)

    with patch("asyncio.get_running_loop", return_value=mock_loop):
        mock_context = ChainlitContext(session=session)
        token = context_var.set(mock_context)
        try:
            yield mock_context
        finally:
            context_var.reset(token)


class TestChatContext:
    """Test suite for ChatContext class."""

    def setup_method(self):
        """Clear chat_contexts before each test."""
        chat_contexts.clear()

    def teardown_method(self):
        """Clear chat_contexts after each test."""
        chat_contexts.clear()

    def test_get_without_session(self):
        """Test get returns empty list when no session exists."""
        with mock_chainlit_context(session=None):
            result = chat_context.get()
            assert result == []

    def test_get_with_new_session(self):
        """Test get creates new chat context for new session."""
        mock_session = Mock()
        mock_session.id = "session_123"

        with mock_chainlit_context(session=mock_session):
            result = chat_context.get()

            assert result == []
            assert "session_123" in chat_contexts
            assert chat_contexts["session_123"] == []

    def test_get_returns_copy(self):
        """Test get returns a copy of the chat context."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_message = Mock()
        chat_contexts["session_123"] = [mock_message]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.get()

            assert result == [mock_message]
            # Verify it's a copy, not the original
            assert result is not chat_contexts["session_123"]

    def test_get_with_existing_messages(self):
        """Test get returns existing messages."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_msg1 = Mock()
        mock_msg2 = Mock()
        chat_contexts["session_123"] = [mock_msg1, mock_msg2]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.get()

            assert len(result) == 2
            assert mock_msg1 in result
            assert mock_msg2 in result

    def test_add_without_session(self):
        """Test add does nothing when no session exists."""
        mock_message = Mock()

        with mock_chainlit_context(session=None):
            result = chat_context.add(mock_message)

            assert result is None
            assert len(chat_contexts) == 0

    def test_add_with_new_session(self):
        """Test add creates new chat context and adds message."""
        mock_session = Mock()
        mock_session.id = "session_123"
        mock_message = Mock()

        with mock_chainlit_context(session=mock_session):
            result = chat_context.add(mock_message)

            assert result == mock_message
            assert "session_123" in chat_contexts
            assert mock_message in chat_contexts["session_123"]

    def test_add_message_to_existing_context(self):
        """Test add appends message to existing context."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_msg1 = Mock()
        mock_msg2 = Mock()
        chat_contexts["session_123"] = [mock_msg1]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.add(mock_msg2)

            assert result == mock_msg2
            assert len(chat_contexts["session_123"]) == 2
            assert mock_msg1 in chat_contexts["session_123"]
            assert mock_msg2 in chat_contexts["session_123"]

    def test_add_duplicate_message(self):
        """Test add does not add duplicate messages."""
        mock_session = Mock()
        mock_session.id = "session_123"
        mock_message = Mock()

        chat_contexts["session_123"] = [mock_message]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.add(mock_message)

            assert result == mock_message
            assert len(chat_contexts["session_123"]) == 1

    def test_remove_without_session(self):
        """Test remove returns False when no session exists."""
        mock_message = Mock()

        with mock_chainlit_context(session=None):
            result = chat_context.remove(mock_message)

            assert result is False

    def test_remove_with_nonexistent_context(self):
        """Test remove returns False when context doesn't exist."""
        mock_session = Mock()
        mock_session.id = "session_123"
        mock_message = Mock()

        with mock_chainlit_context(session=mock_session):
            result = chat_context.remove(mock_message)

            assert result is False

    def test_remove_nonexistent_message(self):
        """Test remove returns False when message not in context."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_msg1 = Mock()
        mock_msg2 = Mock()
        chat_contexts["session_123"] = [mock_msg1]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.remove(mock_msg2)

            assert result is False
            assert mock_msg1 in chat_contexts["session_123"]

    def test_remove_existing_message(self):
        """Test remove successfully removes message."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_msg1 = Mock()
        mock_msg2 = Mock()
        chat_contexts["session_123"] = [mock_msg1, mock_msg2]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.remove(mock_msg1)

            assert result is True
            assert mock_msg1 not in chat_contexts["session_123"]
            assert mock_msg2 in chat_contexts["session_123"]
            assert len(chat_contexts["session_123"]) == 1

    def test_clear_without_session(self):
        """Test clear does nothing when no session exists."""
        chat_contexts["session_123"] = [Mock()]

        with mock_chainlit_context(session=None):
            chat_context.clear()

            # Original context should remain
            assert "session_123" in chat_contexts

    def test_clear_with_nonexistent_context(self):
        """Test clear does nothing when context doesn't exist."""
        mock_session = Mock()
        mock_session.id = "session_456"

        chat_contexts["session_123"] = [Mock()]

        with mock_chainlit_context(session=mock_session):
            chat_context.clear()

            # Original context should remain
            assert "session_123" in chat_contexts

    def test_clear_existing_context(self):
        """Test clear empties existing context."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_msg1 = Mock()
        mock_msg2 = Mock()
        chat_contexts["session_123"] = [mock_msg1, mock_msg2]

        with mock_chainlit_context(session=mock_session):
            chat_context.clear()

            assert "session_123" in chat_contexts
            assert chat_contexts["session_123"] == []

    def test_to_openai_with_assistant_message(self):
        """Test to_openai converts assistant messages correctly."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_message = Mock()
        mock_message.type = "assistant_message"
        mock_message.content = "Hello, how can I help?"

        chat_contexts["session_123"] = [mock_message]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.to_openai()

            assert len(result) == 1
            assert result[0] == {
                "role": "assistant",
                "content": "Hello, how can I help?",
            }

    def test_to_openai_with_user_message(self):
        """Test to_openai converts user messages correctly."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_message = Mock()
        mock_message.type = "user_message"
        mock_message.content = "What is the weather?"

        chat_contexts["session_123"] = [mock_message]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.to_openai()

            assert len(result) == 1
            assert result[0] == {"role": "user", "content": "What is the weather?"}

    def test_to_openai_with_system_message(self):
        """Test to_openai converts system messages correctly."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_message = Mock()
        mock_message.type = "system_message"
        mock_message.content = "You are a helpful assistant."

        chat_contexts["session_123"] = [mock_message]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.to_openai()

            assert len(result) == 1
            assert result[0] == {
                "role": "system",
                "content": "You are a helpful assistant.",
            }

    def test_to_openai_with_unknown_message_type(self):
        """Test to_openai treats unknown types as system messages."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_message = Mock()
        mock_message.type = "unknown_type"
        mock_message.content = "Unknown message"

        chat_contexts["session_123"] = [mock_message]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.to_openai()

            assert len(result) == 1
            assert result[0] == {"role": "system", "content": "Unknown message"}

    def test_to_openai_with_multiple_messages(self):
        """Test to_openai converts multiple messages correctly."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_msg1 = Mock()
        mock_msg1.type = "user_message"
        mock_msg1.content = "Hello"

        mock_msg2 = Mock()
        mock_msg2.type = "assistant_message"
        mock_msg2.content = "Hi there!"

        mock_msg3 = Mock()
        mock_msg3.type = "user_message"
        mock_msg3.content = "How are you?"

        chat_contexts["session_123"] = [mock_msg1, mock_msg2, mock_msg3]

        with mock_chainlit_context(session=mock_session):
            result = chat_context.to_openai()

            assert len(result) == 3
            assert result[0] == {"role": "user", "content": "Hello"}
            assert result[1] == {"role": "assistant", "content": "Hi there!"}
            assert result[2] == {"role": "user", "content": "How are you?"}

    def test_to_openai_with_empty_context(self):
        """Test to_openai returns empty list for empty context."""
        mock_session = Mock()
        mock_session.id = "session_123"

        chat_contexts["session_123"] = []

        with mock_chainlit_context(session=mock_session):
            result = chat_context.to_openai()

            assert result == []

    def test_to_openai_without_session(self):
        """Test to_openai returns empty list when no session exists."""
        with mock_chainlit_context(session=None):
            result = chat_context.to_openai()

            assert result == []


class TestChatContextEdgeCases:
    """Test suite for chat_context edge cases."""

    def setup_method(self):
        """Clear chat_contexts before each test."""
        chat_contexts.clear()

    def teardown_method(self):
        """Clear chat_contexts after each test."""
        chat_contexts.clear()

    def test_multiple_sessions_isolated(self):
        """Test that different sessions have isolated contexts."""
        mock_session1 = Mock()
        mock_session1.id = "session_1"

        mock_session2 = Mock()
        mock_session2.id = "session_2"

        mock_msg1 = Mock()
        mock_msg2 = Mock()

        with mock_chainlit_context(session=mock_session1):
            chat_context.add(mock_msg1)

        with mock_chainlit_context(session=mock_session2):
            chat_context.add(mock_msg2)

        assert len(chat_contexts) == 2
        assert mock_msg1 in chat_contexts["session_1"]
        assert mock_msg2 in chat_contexts["session_2"]
        assert mock_msg1 not in chat_contexts["session_2"]
        assert mock_msg2 not in chat_contexts["session_1"]

    def test_add_then_remove_then_add_again(self):
        """Test adding, removing, and re-adding the same message."""
        mock_session = Mock()
        mock_session.id = "session_123"
        mock_message = Mock()

        with mock_chainlit_context(session=mock_session):
            # Add
            chat_context.add(mock_message)
            assert len(chat_contexts["session_123"]) == 1

            # Remove
            result = chat_context.remove(mock_message)
            assert result is True
            assert len(chat_contexts["session_123"]) == 0

            # Add again
            chat_context.add(mock_message)
            assert len(chat_contexts["session_123"]) == 1

    def test_clear_then_add(self):
        """Test adding messages after clearing context."""
        mock_session = Mock()
        mock_session.id = "session_123"

        mock_msg1 = Mock()
        mock_msg2 = Mock()

        with mock_chainlit_context(session=mock_session):
            chat_context.add(mock_msg1)
            chat_context.clear()
            chat_context.add(mock_msg2)

            result = chat_context.get()
            assert len(result) == 1
            assert mock_msg2 in result
            assert mock_msg1 not in result

    def test_to_openai_with_mixed_message_types(self):
        """Test to_openai with various message types in sequence."""
        mock_session = Mock()
        mock_session.id = "session_123"

        messages = [
            Mock(type="system_message", content="System prompt"),
            Mock(type="user_message", content="User query"),
            Mock(type="assistant_message", content="Assistant response"),
            Mock(type="other_type", content="Other message"),
        ]

        chat_contexts["session_123"] = messages

        with mock_chainlit_context(session=mock_session):
            result = chat_context.to_openai()

            assert len(result) == 4
            assert result[0]["role"] == "system"
            assert result[1]["role"] == "user"
            assert result[2]["role"] == "assistant"
            assert result[3]["role"] == "system"  # Unknown types default to system

    def test_chat_context_singleton(self):
        """Test that chat_context is a singleton instance."""
        from chainlit.chat_context import chat_context as imported_context

        assert chat_context is imported_context

    def test_add_returns_message(self):
        """Test that add returns the message for chaining."""
        mock_session = Mock()
        mock_session.id = "session_123"
        mock_message = Mock()

        with mock_chainlit_context(session=mock_session):
            result = chat_context.add(mock_message)

            assert result is mock_message
