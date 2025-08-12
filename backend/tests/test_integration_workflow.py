"""Integration test demonstrating the complete dynamic configuration workflow."""

import pytest

from chainlit import config
from chainlit.callbacks import on_profile_switch, set_chat_profiles
from chainlit.config import update_config
from chainlit.types import ChatProfile


async def test_complete_dynamic_config_workflow(
    mock_chainlit_context, test_config: config.ChainlitConfig
):
    """Test the complete workflow from profile definition to configuration updates."""

    async with mock_chainlit_context as context:
        # Step 1: Define chat profiles
        @set_chat_profiles
        async def get_profiles(user):
            return [
                ChatProfile(
                    name="text-assistant",
                    markdown_description="Text-only assistant",
                    default=True,
                ),
                ChatProfile(
                    name="vision-assistant",
                    markdown_description="AI with vision capabilities",
                ),
                ChatProfile(
                    name="research-assistant",
                    markdown_description="Research and document analysis",
                ),
            ]

        # Verify profiles are registered
        assert test_config.code.set_chat_profiles is not None
        profiles = await test_config.code.set_chat_profiles(None)
        assert len(profiles) == 3
        assert profiles[0].name == "text-assistant"
        assert profiles[1].name == "vision-assistant"
        assert profiles[2].name == "research-assistant"

        # Step 2: Define profile switch handler
        profile_switch_history = []

        @on_profile_switch
        async def handle_profile_switch(profile: ChatProfile):
            profile_switch_history.append(profile.name)

            if profile.name == "text-assistant":
                await update_config(
                    {
                        "features": {"spontaneous_file_upload": {"enabled": False}},
                        "ui": {
                            "name": "Text Assistant",
                            "description": "Your text-focused AI assistant",
                        },
                    }
                )

            elif profile.name == "vision-assistant":
                await update_config(
                    {
                        "features": {
                            "spontaneous_file_upload": {
                                "enabled": True,
                                "accept": ["image/*"],
                                "max_files": 3,
                                "max_size_mb": 5,
                            }
                        },
                        "ui": {
                            "name": "Vision Assistant",
                            "description": "AI assistant with vision capabilities",
                        },
                    }
                )

            elif profile.name == "research-assistant":
                await update_config(
                    {
                        "features": {
                            "spontaneous_file_upload": {
                                "enabled": True,
                                "accept": ["application/pdf", "text/*"],
                                "max_files": 10,
                                "max_size_mb": 50,
                            },
                            "latex": True,
                        },
                        "ui": {
                            "name": "Research Assistant",
                            "description": "Specialized research and document analysis",
                        },
                    }
                )

        # Verify profile switch handler is registered
        assert test_config.code.on_profile_switch is not None

        # Step 3: Simulate profile switching workflow

        # Switch to vision assistant
        vision_profile = profiles[1]
        await test_config.code.on_profile_switch(vision_profile)

        # Verify configuration was updated
        assert "vision-assistant" in profile_switch_history
        overrides = context.session.config_overrides
        assert overrides["features"]["spontaneous_file_upload"]["enabled"] is True
        assert overrides["features"]["spontaneous_file_upload"]["accept"] == ["image/*"]
        assert overrides["features"]["spontaneous_file_upload"]["max_files"] == 3
        assert overrides["ui"]["name"] == "Vision Assistant"

        # Switch to research assistant
        research_profile = profiles[2]
        await test_config.code.on_profile_switch(research_profile)

        # Verify configuration was updated again
        assert "research-assistant" in profile_switch_history
        overrides = context.session.config_overrides
        assert overrides["features"]["spontaneous_file_upload"]["enabled"] is True
        assert overrides["features"]["spontaneous_file_upload"]["accept"] == [
            "application/pdf",
            "text/*",
        ]
        assert overrides["features"]["spontaneous_file_upload"]["max_files"] == 10
        assert overrides["features"]["spontaneous_file_upload"]["max_size_mb"] == 50
        assert overrides["features"]["latex"] is True
        assert overrides["ui"]["name"] == "Research Assistant"

        # Switch back to text assistant
        text_profile = profiles[0]
        await test_config.code.on_profile_switch(text_profile)

        # Verify configuration was updated to text-only mode
        assert "text-assistant" in profile_switch_history
        overrides = context.session.config_overrides
        assert overrides["features"]["spontaneous_file_upload"]["enabled"] is False
        assert overrides["ui"]["name"] == "Text Assistant"

        # Verify all profile switches were recorded
        assert profile_switch_history == [
            "vision-assistant",
            "research-assistant",
            "text-assistant",
        ]


async def test_configuration_merging_and_isolation(mock_session_factory):
    """Test that configuration merging works correctly and sessions are isolated."""

    # Create two different sessions
    session1 = mock_session_factory(id="session1")
    session2 = mock_session_factory(id="session2")

    # Simulate different configuration updates for each session
    session1.config_overrides = {
        "features": {
            "latex": True,
            "spontaneous_file_upload": {"enabled": True, "max_files": 5},
        },
        "ui": {"name": "Math Assistant"},
    }

    session2.config_overrides = {
        "features": {"spontaneous_file_upload": {"enabled": False}},
        "ui": {"name": "Simple Assistant", "description": "Basic chat"},
    }

    # Verify sessions have different configurations
    assert session1.config_overrides != session2.config_overrides
    assert session1.config_overrides["features"]["latex"] is True
    assert (
        session2.config_overrides["features"]["spontaneous_file_upload"]["enabled"]
        is False
    )

    # Verify UI configurations are different
    assert session1.config_overrides["ui"]["name"] == "Math Assistant"
    assert session2.config_overrides["ui"]["name"] == "Simple Assistant"

    # Verify that updates to one session don't affect the other
    session1.config_overrides["ui"]["name"] = "Updated Math Assistant"
    assert session2.config_overrides["ui"]["name"] == "Simple Assistant"


def test_deep_merge_preserves_existing_settings():
    """Test that configuration merging preserves unmodified settings."""

    from chainlit.config import deep_merge_dict

    base_config = {
        "features": {
            "latex": False,
            "audio": {"enabled": True, "sample_rate": 44100},
            "spontaneous_file_upload": {
                "enabled": False,
                "max_files": 5,
                "max_size_mb": 10,
            },
        },
        "ui": {
            "name": "Default Assistant",
            "description": "Default description",
            "theme": "light",
        },
    }

    # Update only specific settings
    updates = {
        "features": {
            "latex": True,  # Change this
            "spontaneous_file_upload": {
                "enabled": True,  # Change this
                "max_files": 10,  # Change this, but keep max_size_mb unchanged
            },
            # Keep audio settings unchanged
        },
        "ui": {
            "name": "Updated Assistant"  # Change this, keep description and theme
        },
    }

    result = deep_merge_dict(base_config, updates)

    # Verify updated settings
    assert result["features"]["latex"] is True
    assert result["features"]["spontaneous_file_upload"]["enabled"] is True
    assert result["features"]["spontaneous_file_upload"]["max_files"] == 10
    assert result["ui"]["name"] == "Updated Assistant"

    # Verify preserved settings
    assert result["features"]["audio"]["enabled"] is True
    assert result["features"]["audio"]["sample_rate"] == 44100
    assert result["features"]["spontaneous_file_upload"]["max_size_mb"] == 10
    assert result["ui"]["description"] == "Default description"
    assert result["ui"]["theme"] == "light"


async def test_error_handling_in_profile_switch():
    """Test error handling when profile switch callbacks fail."""

    # This simulates what happens when update_config is called without a context
    from chainlit.config import update_config

    # Should raise an exception when called without context
    try:
        await update_config({"ui": {"name": "Test"}})
        pytest.fail("Expected exception when calling update_config without context")
    except Exception:
        pass  # This is expected


def test_backward_compatibility(test_config: config.ChainlitConfig):
    """Test that existing functionality remains unchanged."""

    # Verify that existing callback registration still works
    from chainlit.callbacks import (
        on_chat_start,
        on_message,
        on_profile_switch,
        set_chat_profiles,
    )
    from chainlit.message import Message
    from chainlit.types import ChatProfile

    profiles_registered = False
    message_handler_registered = False
    chat_start_registered = False
    profile_switch_registered = False

    @set_chat_profiles
    async def get_profiles(user):
        nonlocal profiles_registered
        profiles_registered = True
        return [ChatProfile(name="test", markdown_description="Test profile")]

    @on_message
    async def handle_message(message: Message):
        nonlocal message_handler_registered
        message_handler_registered = True

    @on_chat_start
    async def handle_chat_start():
        nonlocal chat_start_registered
        chat_start_registered = True

    @on_profile_switch
    async def handle_profile_switch(profile: ChatProfile):
        nonlocal profile_switch_registered
        profile_switch_registered = True

    # Verify all decorators worked (callbacks are registered)
    # Note: We can't actually call them without proper context setup,
    # but we can verify they were registered
    assert test_config.code.set_chat_profiles is not None
    assert test_config.code.on_message is not None
    assert test_config.code.on_chat_start is not None
    assert (
        test_config.code.on_profile_switch is not None
    )  # New callback is also available
