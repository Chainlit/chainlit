"""Tests for LLM picker functionality."""

from unittest.mock import patch

import pytest

import chainlit as cl


@pytest.fixture
def mock_llms():
    """Fixture providing sample LLMs for testing."""
    return [
        {
            "id": "gpt-4",
            "name": "GPT-4",
            "description": "Most capable model",
            "icon": "sparkles",
            "default": True,
        },
        {
            "id": "gpt-3.5-turbo",
            "name": "GPT-3.5 Turbo",
            "description": "Fast and efficient",
            "icon": "bolt",
            "default": False,
        },
    ]


@pytest.mark.asyncio
class TestLLMPicker:
    """Test suite for LLM picker functionality."""

    def test_llm_dict_structure(self, mock_llms):
        """Test that LLMDict has the correct structure."""
        llm = mock_llms[0]
        assert "id" in llm
        assert "name" in llm
        assert "description" in llm
        assert "icon" in llm
        assert "default" in llm

    async def test_message_with_llm(self, mock_chainlit_context):
        """Test that Message can be created with an llm field."""
        async with mock_chainlit_context:
            message = cl.Message(content="Test message", llm="gpt-4")
            assert message.llm == "gpt-4"
            assert message.content == "Test message"

    async def test_message_to_dict_includes_llm(self, mock_chainlit_context):
        """Test that Message.to_dict() includes the llm field."""
        async with mock_chainlit_context:
            message = cl.Message(content="Test", llm="gpt-4")
            message_dict = message.to_dict()
            assert "llm" in message_dict
            assert message_dict["llm"] == "gpt-4"

    async def test_message_from_dict_with_llm(self, mock_chainlit_context):
        """Test that Message.from_dict() correctly handles llm field."""
        async with mock_chainlit_context:
            message_dict = {
                "id": "test-id",
                "content": "Test message",
                "llm": "gpt-3.5-turbo",
                "type": "user_message",
                "createdAt": "2024-01-01T00:00:00",
                "output": "Test message",
            }
            message = cl.Message.from_dict(message_dict)
            assert message.llm == "gpt-3.5-turbo"
            assert message.content == "Test message"

    async def test_message_without_llm(self, mock_chainlit_context):
        """Test that Message works without llm field (backward compatibility)."""
        async with mock_chainlit_context:
            message = cl.Message(content="Test message")
            assert message.llm is None
            message_dict = message.to_dict()
            assert message_dict.get("llm") is None

    async def test_set_llms_callback(self, test_config):
        """Test that set_llms callback can be registered."""
        called = False
        test_llms = [
            {"id": "test", "name": "Test", "description": "Test LLM", "icon": "test"}
        ]

        async def mock_set_llms(user, language):
            nonlocal called
            called = True
            return test_llms

        # Register the callback
        test_config.code.set_llms = mock_set_llms

        # Call it
        result = await test_config.code.set_llms(None, "en-US")

        assert called
        assert result == test_llms

    def test_llm_default_selection(self, mock_llms):
        """Test that default LLM can be identified."""
        default_llm = next((llm for llm in mock_llms if llm.get("default")), None)
        assert default_llm is not None
        assert default_llm["id"] == "gpt-4"

    def test_llm_fallback_to_first(self, mock_llms):
        """Test fallback to first LLM when no default is set."""
        # Remove default flags
        llms_no_default = [{**llm, "default": False} for llm in mock_llms]

        # Should fall back to first LLM
        default_llm = next(
            (llm for llm in llms_no_default if llm.get("default")),
            llms_no_default[0] if llms_no_default else None,
        )
        assert default_llm is not None
        assert default_llm["id"] == "gpt-4"  # First in list

    async def test_message_send_with_llm(self, mock_chainlit_context):
        """Test that sending a message with llm works."""
        async with mock_chainlit_context as ctx:
            message = cl.Message(content="Test", llm="gpt-4")

            with patch("chainlit.message.chat_context") as mock_chat_ctx:
                with patch("chainlit.message.get_data_layer", return_value=None):
                    with patch("chainlit.message.config") as mock_config:
                        mock_config.code.author_rename = None

                        result = await message.send()

                        assert result == message
                        assert message.llm == "gpt-4"
                        mock_chat_ctx.add.assert_called_once_with(message)
                        ctx.emitter.send_step.assert_called_once()
                        # Verify the dict sent to emitter includes llm
                        call_args = ctx.emitter.send_step.call_args[0][0]
                        assert call_args["llm"] == "gpt-4"

    def test_llm_with_all_fields(self, mock_llms):
        """Test that LLM dict includes all required fields."""
        llm = mock_llms[0]

        # Required fields
        assert llm["id"] == "gpt-4"
        assert llm["name"] == "GPT-4"

        # Optional fields
        assert "description" in llm
        assert "icon" in llm
        assert "default" in llm
