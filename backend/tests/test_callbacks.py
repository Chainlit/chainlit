from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, Mock

from chainlit import config
from chainlit.callbacks import password_auth_callback
from chainlit.data.base import BaseDataLayer
from chainlit.types import ThreadDict
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

    async with mock_chainlit_context:
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


async def test_on_stop(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import on_stop

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
        test_action = Action(name="test_action", payload={"value": "test_value"})
        await test_config.code.action_callbacks["test_action"](test_action)

        # Check that the action_handled flag was set
        assert action_handled


async def test_on_settings_update(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import on_settings_update

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


async def test_on_app_startup(test_config: config.ChainlitConfig):
    """Test the on_app_startup callback registration and execution for sync and async functions."""
    from chainlit.callbacks import on_app_startup

    # Test with synchronous function
    sync_startup_called = False

    @on_app_startup
    def sync_startup():
        nonlocal sync_startup_called
        sync_startup_called = True

    assert test_config.code.on_app_startup is not None, (
        "Sync startup callback not registered"
    )
    # Call the wrapped function (which might be async due to wrap_user_function)
    result = test_config.code.on_app_startup()
    if asyncio.iscoroutine(result):
        await result
    assert sync_startup_called, "Sync startup function was not called"

    # Reset for async test
    test_config.code.on_app_startup = None  # Explicitly clear previous registration

    # Test with asynchronous function
    async_startup_called = False

    @on_app_startup
    async def async_startup():
        nonlocal async_startup_called
        await asyncio.sleep(0)  # Simulate async work
        async_startup_called = True

    assert test_config.code.on_app_startup is not None, (
        "Async startup callback not registered"
    )
    # Call the wrapped function (which should be async)
    result = test_config.code.on_app_startup()
    assert asyncio.iscoroutine(result), (
        "Async startup function did not return a coroutine"
    )
    await result
    assert async_startup_called, "Async startup function was not called"


async def test_on_app_shutdown(test_config: config.ChainlitConfig):
    """Test the on_app_shutdown callback registration and execution for sync and async functions."""
    from chainlit.callbacks import on_app_shutdown

    # Test with synchronous function
    sync_shutdown_called = False

    @on_app_shutdown
    def sync_shutdown():
        nonlocal sync_shutdown_called
        sync_shutdown_called = True

    assert test_config.code.on_app_shutdown is not None, (
        "Sync shutdown callback not registered"
    )
    # Call the wrapped function
    result = test_config.code.on_app_shutdown()
    if asyncio.iscoroutine(result):
        await result
    assert sync_shutdown_called, "Sync shutdown function was not called"

    # Reset for async test
    test_config.code.on_app_shutdown = None  # Explicitly clear previous registration

    # Test with asynchronous function
    async_shutdown_called = False

    @on_app_shutdown
    async def async_shutdown():
        nonlocal async_shutdown_called
        await asyncio.sleep(0)  # Simulate async work
        async_shutdown_called = True

    assert test_config.code.on_app_shutdown is not None, (
        "Async shutdown callback not registered"
    )
    # Call the wrapped function
    result = test_config.code.on_app_shutdown()
    assert asyncio.iscoroutine(result), (
        "Async shutdown function did not return a coroutine"
    )
    await result
    assert async_shutdown_called, "Async shutdown function was not called"


async def test_on_chat_start(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import on_chat_start

    async with mock_chainlit_context:
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


async def test_on_chat_resume(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import on_chat_resume

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
    from chainlit.types import ChatProfile

    async with mock_chainlit_context:

        @set_chat_profiles
        async def get_chat_profiles(user, language):
            return [
                ChatProfile(name="Test Profile", markdown_description="A test profile")
            ]

        # Test that the callback is properly registered
        assert test_config.code.set_chat_profiles is not None

        # Call the registered callback
        result = await test_config.code.set_chat_profiles(None, None)

        # Check the result
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        assert isinstance(result[0], ChatProfile)
        assert result[0].name == "Test Profile"
        assert result[0].markdown_description == "A test profile"


async def test_set_chat_profiles_language(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import set_chat_profiles
    from chainlit.types import ChatProfile

    async with mock_chainlit_context:

        @set_chat_profiles
        async def get_chat_profiles(user, language):
            if language == "fr-CA":
                return [
                    ChatProfile(
                        name="Profil de test", markdown_description="Un profil de test"
                    )
                ]

            return [
                ChatProfile(name="Test Profile", markdown_description="A test profile")
            ]

        # Test that the callback is properly registered
        assert test_config.code.set_chat_profiles is not None

        # Call the registered callback
        result = await test_config.code.set_chat_profiles(None, "fr-CA")

        # Check the result
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        assert isinstance(result[0], ChatProfile)
        assert result[0].name == "Profil de test"
        assert result[0].markdown_description == "Un profil de test"


async def test_set_starters(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import set_starters
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
        result = await test_config.code.set_starters(None, None)

        # Check the result
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        assert isinstance(result[0], Starter)
        assert result[0].label == "Test Label"
        assert result[0].message == "Test Message"


async def test_set_starters_language(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import set_starters
    from chainlit.types import Starter

    async with mock_chainlit_context:

        @set_starters
        async def get_starters(user, language):
            if language == "fr-CA":
                return [
                    Starter(
                        label="Étiquette de test",
                        message="Message de test",
                    )
                ]

            return [
                Starter(
                    label="Test Label",
                    message="Test Message",
                )
            ]

        # Test that the callback is properly registered
        assert test_config.code.set_starters is not None

        # Call the registered callback
        result = await test_config.code.set_starters(None, "fr-CA")

        # Check the result
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        assert isinstance(result[0], Starter)
        assert result[0].label == "Étiquette de test"
        assert result[0].message == "Message de test"


async def test_on_shared_thread_view_allow(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import on_shared_thread_view
    from chainlit.user import User

    async with mock_chainlit_context:
        # Simulate a viewer with access to certain chat profiles
        allowed_profiles_by_user = {"viewer": {"pro", "basic"}}

        @on_shared_thread_view
        async def allow_shared_view(thread, viewer: User | None):
            md = thread.get("metadata") or {}
            chat_profile = (md or {}).get("chat_profile")
            if not md.get("is_shared"):
                return False
            if not viewer:
                return False
            return chat_profile in allowed_profiles_by_user.get(
                viewer.identifier, set()
            )

        assert test_config.code.on_shared_thread_view is not None

        thread: ThreadDict = {
            "id": "t1",
            "createdAt": "2025-09-03T00:00:00Z",
            "name": "Shared Thread",
            "userId": "author_id",
            "userIdentifier": "author",
            "tags": [],
            "metadata": {"is_shared": True, "chat_profile": "pro"},
            "steps": [],
            "elements": [],
        }
        viewer = User(identifier="viewer")

        res = await test_config.code.on_shared_thread_view(thread, viewer)
        assert res is True


async def test_on_shared_thread_view_block_and_exception(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    from chainlit.callbacks import on_shared_thread_view
    from chainlit.user import User

    async with mock_chainlit_context:
        # Case 1: Explicitly return False when profile not allowed
        @on_shared_thread_view
        async def deny_when_not_allowed(thread, viewer: User | None):
            md = thread.get("metadata") or {}
            return md.get("chat_profile") == "allowed"

        assert test_config.code.on_shared_thread_view is not None

        thread: ThreadDict = {
            "id": "t2",
            "createdAt": "2025-09-03T00:00:00Z",
            "name": "Shared Thread",
            "userId": "author_id",
            "userIdentifier": "author",
            "tags": [],
            "metadata": {"is_shared": True, "chat_profile": "restricted"},
            "steps": [],
            "elements": [],
        }
        viewer = User(identifier="viewer")
        res = await test_config.code.on_shared_thread_view(thread, viewer)
        assert not res

        # Case 2: Raise an exception inside callback; wrapper should swallow and result should be falsy
        @on_shared_thread_view
        async def raise_on_forbidden(thread, viewer: User | None):
            md = thread.get("metadata") or {}
            if md.get("chat_profile") == "forbidden":
                raise ValueError("Viewer not allowed for this profile")
            return True

        assert test_config.code.on_shared_thread_view is not None

        thread_err: ThreadDict = {
            "id": "t3",
            "createdAt": "2025-09-03T00:00:00Z",
            "name": "Shared Thread",
            "userId": "author_id",
            "userIdentifier": "author",
            "tags": [],
            "metadata": {"is_shared": True, "chat_profile": "forbidden"},
            "steps": [],
            "elements": [],
        }
        res2 = await test_config.code.on_shared_thread_view(thread_err, viewer)
        assert not res2


async def test_on_chat_end(mock_chainlit_context, test_config: config.ChainlitConfig):
    from chainlit.callbacks import on_chat_end

    async with mock_chainlit_context:
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


def test_data_layer_config(
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


def test_chat_profile_with_config_overrides():
    """Test that ChatProfile can be created with config_overrides."""
    from chainlit.config import (
        ChainlitConfigOverrides,
        FeaturesSettings,
        McpFeature,
        UISettings,
    )
    from chainlit.types import ChatProfile

    # Test creating a profile without config_overrides
    basic_profile = ChatProfile(
        name="Basic Profile", markdown_description="A basic profile without overrides"
    )
    assert basic_profile.config_overrides is None

    # Test creating a profile with config_overrides
    config_overrides = ChainlitConfigOverrides(
        features=FeaturesSettings(mcp=McpFeature(enabled=True)),
        ui=UISettings(
            name="Custom App Name",
            description="Custom description",
            default_theme="light",
        ),
    )

    profile_with_overrides = ChatProfile(
        name="MCP Profile",
        markdown_description="A profile with MCP enabled",
        config_overrides=config_overrides,
    )

    # Verify the profile was created successfully
    assert profile_with_overrides.name == "MCP Profile"
    assert profile_with_overrides.config_overrides is not None
    assert profile_with_overrides.config_overrides.features.mcp.enabled is True
    assert profile_with_overrides.config_overrides.ui.name == "Custom App Name"
    assert profile_with_overrides.config_overrides.ui.default_theme == "light"


async def test_set_chat_profiles_with_config_overrides(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    """Test that set_chat_profiles callback works with profiles that have config_overrides."""
    from chainlit.callbacks import set_chat_profiles
    from chainlit.config import (
        ChainlitConfigOverrides,
        FeaturesSettings,
        McpFeature,
        UISettings,
    )
    from chainlit.types import ChatProfile

    async with mock_chainlit_context:

        @set_chat_profiles
        async def get_chat_profiles(user, language):
            return [
                ChatProfile(
                    name="Basic Profile",
                    markdown_description="A basic profile without overrides",
                ),
                ChatProfile(
                    name="MCP Profile",
                    markdown_description="A profile with MCP enabled",
                    config_overrides=ChainlitConfigOverrides(
                        features=FeaturesSettings(mcp=McpFeature(enabled=True)),
                        ui=UISettings(name="MCP Assistant", default_theme="dark"),
                    ),
                ),
                ChatProfile(
                    name="Light Theme Profile",
                    markdown_description="A profile with light theme",
                    config_overrides=ChainlitConfigOverrides(
                        ui=UISettings(name="Light Theme App", default_theme="light")
                    ),
                ),
            ]

        # Test that the callback is properly registered
        assert test_config.code.set_chat_profiles is not None

        # Call the registered callback
        result = await test_config.code.set_chat_profiles(None, None)

        # Check the result
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 3

        # Test basic profile
        basic_profile = result[0]
        assert basic_profile.name == "Basic Profile"
        assert basic_profile.config_overrides is None

        # Test MCP profile
        mcp_profile = result[1]
        assert mcp_profile.name == "MCP Profile"
        assert mcp_profile.config_overrides is not None
        assert mcp_profile.config_overrides.features.mcp.enabled is True
        assert mcp_profile.config_overrides.ui.name == "MCP Assistant"
        assert mcp_profile.config_overrides.ui.default_theme == "dark"

        # Test light theme profile
        light_profile = result[2]
        assert light_profile.name == "Light Theme Profile"
        assert light_profile.config_overrides is not None
        assert light_profile.config_overrides.ui.name == "Light Theme App"
        assert light_profile.config_overrides.ui.default_theme == "light"
