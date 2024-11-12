from __future__ import annotations

from unittest.mock import AsyncMock, Mock

import pytest

from chainlit import config
from chainlit.callbacks import data_layer, password_auth_callback
from chainlit.data import get_data_layer
from chainlit.data.base import BaseDataLayer
from chainlit.user import User


async def test_password_auth_callback(test_config: config.ChainlitConfig):
    @password_auth_callback
    async def auth_func(username: str, password: str) -> User | None:
        if username == "testuser" and password == "testpass":  # nosec B105
            return User(identifier="testuser")
        return None

    # Test that the callback is properly registered
    assert test_config.code.password_auth_callback is not None

    # Test the wrapped function
    result = await test_config.code.password_auth_callback("testuser", "testpass")
    assert isinstance(result, User)
    assert result.identifier == "testuser"

    # Test with incorrect credentials
    result = await test_config.code.password_auth_callback("wronguser", "wrongpass")
    assert result is None


async def test_header_auth_callback(test_config: config.ChainlitConfig):
    from starlette.datastructures import Headers

    from chainlit.callbacks import header_auth_callback

    @header_auth_callback
    async def auth_func(headers: Headers) -> User | None:
        if headers.get("Authorization") == "Bearer valid_token":
            return User(identifier="testuser")
        return None

    # Test that the callback is properly registered
    assert test_config.code.header_auth_callback is not None

    # Test the wrapped function with valid header
    valid_headers = Headers({"Authorization": "Bearer valid_token"})
    result = await test_config.code.header_auth_callback(valid_headers)
    assert isinstance(result, User)
    assert result.identifier == "testuser"

    # Test with invalid header
    invalid_headers = Headers({"Authorization": "Bearer invalid_token"})
    result = await test_config.code.header_auth_callback(invalid_headers)
    assert result is None

    # Test with missing header
    missing_headers = Headers({})
    result = await test_config.code.header_auth_callback(missing_headers)
    assert result is None


async def test_oauth_callback(test_config: config.ChainlitConfig):
    from unittest.mock import patch

    from chainlit.callbacks import oauth_callback
    from chainlit.config import config
    from chainlit.user import User

    # Mock the get_configured_oauth_providers function
    with patch(
        "chainlit.callbacks.get_configured_oauth_providers", return_value=["google"]
    ):

        @oauth_callback
        async def auth_func(
            provider_id: str,
            token: str,
            raw_user_data: dict,
            default_app_user: User,
            id_token: str | None = None,
        ) -> User | None:
            if provider_id == "google" and token == "valid_token":  # nosec B105
                return User(identifier="oauth_user")
            return None

        # Test that the callback is properly registered
        assert test_config.code.oauth_callback is not None

        # Test the wrapped function with valid data
        result = await test_config.code.oauth_callback(
            "google", "valid_token", {}, User(identifier="default_user")
        )
        assert isinstance(result, User)
        assert result.identifier == "oauth_user"

        # Test with invalid data
        result = await test_config.code.oauth_callback(
            "facebook", "invalid_token", {}, User(identifier="default_user")
        )
        assert result is None


async def test_on_message(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import on_message
    from chainlit.message import Message

    async with mock_chainlit_context as context:
        message_received = None

        @on_message
        async def handle_message(message: Message):
            nonlocal message_received
            message_received = message

        # Test that the callback is properly registered
        assert test_config.code.on_message is not None

        # Create a test message
        test_message = Message(content="Test message", author="User")

        # Call the registered callback
        await test_config.code.on_message(test_message)

        # Check that the message was received by our handler
        assert message_received is not None
        assert message_received.content == "Test message"
        assert message_received.author == "User"

        # Check that the emit method was called
        context.session.emit.assert_called()


async def test_on_stop(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import on_stop
    from chainlit.config import config

    async with mock_chainlit_context:
        stop_called = False

        @on_stop
        async def handle_stop():
            nonlocal stop_called
            stop_called = True

        # Test that the callback is properly registered
        assert test_config.code.on_stop is not None

        # Call the registered callback
        await test_config.code.on_stop()

        # Check that the stop_called flag was set
        assert stop_called


async def test_action_callback(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.action import Action
    from chainlit.callbacks import action_callback
    from chainlit.config import config

    async with mock_chainlit_context:
        action_handled = False

        @action_callback("test_action")
        async def handle_action(action: Action):
            nonlocal action_handled
            action_handled = True
            assert action.name == "test_action"

        # Test that the callback is properly registered
        assert "test_action" in test_config.code.action_callbacks

        # Call the registered callback
        test_action = Action(name="test_action", value="test_value")
        await test_config.code.action_callbacks["test_action"](test_action)

        # Check that the action_handled flag was set
        assert action_handled


async def test_on_settings_update(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import on_settings_update
    from chainlit.config import config

    async with mock_chainlit_context:
        settings_updated = False

        @on_settings_update
        async def handle_settings_update(settings: dict):
            nonlocal settings_updated
            settings_updated = True
            assert settings == {"test_setting": "test_value"}

        # Test that the callback is properly registered
        assert test_config.code.on_settings_update is not None

        # Call the registered callback
        await test_config.code.on_settings_update({"test_setting": "test_value"})

        # Check that the settings_updated flag was set
        assert settings_updated


async def test_author_rename(test_config: config.ChainlitConfig):
    from chainlit.callbacks import author_rename
    from chainlit.config import config

    @author_rename
    async def rename_author(author: str) -> str:
        if author == "AI":
            return "Assistant"
        return author

    # Test that the callback is properly registered
    assert test_config.code.author_rename is not None

    # Call the registered callback
    result = await test_config.code.author_rename("AI")
    assert result == "Assistant"

    result = await test_config.code.author_rename("Human")
    assert result == "Human"

    # Test that the callback is properly registered
    assert test_config.code.author_rename is not None

    # Call the registered callback
    result = await test_config.code.author_rename("AI")
    assert result == "Assistant"

    result = await test_config.code.author_rename("Human")
    assert result == "Human"


async def test_on_chat_start(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import on_chat_start
    from chainlit.config import config

    async with mock_chainlit_context as context:
        chat_started = False

        @on_chat_start
        async def handle_chat_start():
            nonlocal chat_started
            chat_started = True

        # Test that the callback is properly registered
        assert test_config.code.on_chat_start is not None

        # Call the registered callback
        await test_config.code.on_chat_start()

        # Check that the chat_started flag was set
        assert chat_started

        # Check that the emit method was called
        context.session.emit.assert_called()


async def test_on_chat_resume(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import on_chat_resume
    from chainlit.config import config
    from chainlit.types import ThreadDict

    async with mock_chainlit_context:
        chat_resumed = False

        @on_chat_resume
        async def handle_chat_resume(thread: ThreadDict):
            nonlocal chat_resumed
            chat_resumed = True
            assert thread["id"] == "test_thread_id"

        # Test that the callback is properly registered
        assert test_config.code.on_chat_resume is not None

        # Call the registered callback
        await test_config.code.on_chat_resume(
            {
                "id": "test_thread_id",
                "createdAt": "2023-01-01T00:00:00Z",
                "name": "Test Thread",
                "userId": "test_user_id",
                "userIdentifier": "test_user",
                "tags": [],
                "metadata": {},
                "steps": [],
                "elements": [],
            }
        )

        # Check that the chat_resumed flag was set
        assert chat_resumed


async def test_set_chat_profiles(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import set_chat_profiles
    from chainlit.config import config
    from chainlit.types import ChatProfile

    async with mock_chainlit_context:

        @set_chat_profiles
        async def get_chat_profiles(user):
            return [
                ChatProfile(name="Test Profile", markdown_description="A test profile")
            ]

        # Test that the callback is properly registered
        assert test_config.code.set_chat_profiles is not None

        # Call the registered callback
        result = await test_config.code.set_chat_profiles(None)

        # Check the result
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        assert isinstance(result[0], ChatProfile)
        assert result[0].name == "Test Profile"
        assert result[0].markdown_description == "A test profile"


async def test_set_starters(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import set_starters
    from chainlit.config import config
    from chainlit.types import Starter

    async with mock_chainlit_context:

        @set_starters
        async def get_starters(user):
            return [
                Starter(
                    label="Test Label",
                    message="Test Message",
                )
            ]

        # Test that the callback is properly registered
        assert test_config.code.set_starters is not None

        # Call the registered callback
        result = await test_config.code.set_starters(None)

        # Check the result
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        assert isinstance(result[0], Starter)
        assert result[0].label == "Test Label"
        assert result[0].message == "Test Message"


async def test_on_chat_end(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import on_chat_end
    from chainlit.config import config

    async with mock_chainlit_context as context:
        chat_ended = False

        @on_chat_end
        async def handle_chat_end():
            nonlocal chat_ended
            chat_ended = True

        # Test that the callback is properly registered
        assert test_config.code.on_chat_end is not None

        # Call the registered callback
        await test_config.code.on_chat_end()

        # Check that the chat_ended flag was set
        assert chat_ended

        # Check that the emit method was called
        context.session.emit.assert_called()


async def test_data_layer_config(
    mock_data_layer: AsyncMock,
    test_config: config.ChainlitConfig,
    mock_get_data_layer: Mock,
):
    """Test whether we can properly configure a data layer."""

    # Test that the callback is properly registered
    assert test_config.code.data_layer is not None

    # Call the registered callback
    result = test_config.code.data_layer()

    # Check that the result is an instance of MockDataLayer
    assert isinstance(result, BaseDataLayer)

    mock_get_data_layer.assert_called_once()
