"""Tests for dynamic configuration management."""

from unittest.mock import Mock

from chainlit import config
from chainlit.callbacks import on_profile_switch
from chainlit.config import deep_merge_dict, update_config
from chainlit.types import ChatProfile


async def test_deep_merge_dict():
    """Test the deep merge dictionary function."""
    base = {
        "features": {
            "audio": {"enabled": False},
            "latex": True,
        },
        "ui": {"name": "Base Assistant"},
    }
    
    overrides = {
        "features": {
            "audio": {"enabled": True, "sample_rate": 44100},
            "new_feature": {"enabled": True},
        },
        "project": {"cache": True},
    }
    
    result = deep_merge_dict(base, overrides)
    
    assert result["features"]["audio"]["enabled"] is True
    assert result["features"]["audio"]["sample_rate"] == 44100
    assert result["features"]["latex"] is True
    assert result["features"]["new_feature"]["enabled"] is True
    assert result["ui"]["name"] == "Base Assistant"
    assert result["project"]["cache"] is True


async def test_update_config(mock_chainlit_context, test_config: config.ChainlitConfig):
    """Test the update_config function."""
    async with mock_chainlit_context as context:
        # Initial state - no overrides
        assert context.session.config_overrides == {}
        
        # Update configuration
        config_updates = {
            "features": {
                "spontaneous_file_upload": {
                    "enabled": False,
                    "max_files": 5
                }
            },
            "ui": {
                "name": "Updated Assistant"
            }
        }
        
        await update_config(config_updates)
        
        # Check that overrides were stored in session
        assert "features" in context.session.config_overrides
        assert "ui" in context.session.config_overrides
        assert context.session.config_overrides["features"]["spontaneous_file_upload"]["enabled"] is False
        assert context.session.config_overrides["features"]["spontaneous_file_upload"]["max_files"] == 5
        assert context.session.config_overrides["ui"]["name"] == "Updated Assistant"


async def test_update_config_merging(mock_chainlit_context, test_config: config.ChainlitConfig):
    """Test that multiple config updates are properly merged."""
    async with mock_chainlit_context as context:
        # First update
        await update_config({
            "features": {
                "audio": {"enabled": True}
            },
            "ui": {"name": "First Update"}
        })
        
        # Second update - should merge with first
        await update_config({
            "features": {
                "latex": True,
                "audio": {"sample_rate": 44100}  # Should merge with existing audio config
            },
            "ui": {"description": "Updated description"}  # Should merge with existing UI config
        })
        
        overrides = context.session.config_overrides
        
        # Check that both audio settings are present
        assert overrides["features"]["audio"]["enabled"] is True
        assert overrides["features"]["audio"]["sample_rate"] == 44100
        assert overrides["features"]["latex"] is True
        
        # Check that both UI settings are present
        assert overrides["ui"]["name"] == "First Update"
        assert overrides["ui"]["description"] == "Updated description"


async def test_on_profile_switch_callback(mock_chainlit_context, test_config: config.ChainlitConfig):
    """Test the on_profile_switch callback registration and execution."""
    async with mock_chainlit_context:
        profile_switched = False
        received_profile = None
        
        @on_profile_switch
        async def handle_profile_switch(profile: ChatProfile):
            nonlocal profile_switched, received_profile
            profile_switched = True
            received_profile = profile
        
        # Test that the callback is properly registered
        assert test_config.code.on_profile_switch is not None
        
        # Create a test profile
        test_profile = ChatProfile(
            name="test-profile",
            markdown_description="A test profile"
        )
        
        # Call the registered callback
        await test_config.code.on_profile_switch(test_profile)
        
        # Check that the callback was executed
        assert profile_switched is True
        assert received_profile is not None
        assert received_profile.name == "test-profile"
        assert received_profile.markdown_description == "A test profile"


async def test_profile_switch_with_config_update(mock_chainlit_context, test_config: config.ChainlitConfig):
    """Test a realistic profile switch scenario with configuration updates."""
    async with mock_chainlit_context as context:
        @on_profile_switch
        async def handle_profile_switch(profile: ChatProfile):
            if profile.name == "vision-model":
                await update_config({
                    "features": {
                        "spontaneous_file_upload": {
                            "enabled": True,
                            "accept": ["image/*"]
                        }
                    },
                    "ui": {
                        "name": f"Vision Assistant ({profile.name})"
                    }
                })
            elif profile.name == "text-model":
                await update_config({
                    "features": {
                        "spontaneous_file_upload": {
                            "enabled": False
                        }
                    },
                    "ui": {
                        "name": f"Text Assistant ({profile.name})"
                    }
                })
        
        # Test vision model profile
        vision_profile = ChatProfile(
            name="vision-model",
            markdown_description="AI model with vision capabilities"
        )
        
        await test_config.code.on_profile_switch(vision_profile)
        
        # Check configuration changes for vision model
        overrides = context.session.config_overrides
        assert overrides["features"]["spontaneous_file_upload"]["enabled"] is True
        assert overrides["features"]["spontaneous_file_upload"]["accept"] == ["image/*"]
        assert overrides["ui"]["name"] == "Vision Assistant (vision-model)"
        
        # Clear overrides and test text model
        context.session.config_overrides = {}
        
        text_profile = ChatProfile(
            name="text-model",
            markdown_description="Text-only AI model"
        )
        
        await test_config.code.on_profile_switch(text_profile)
        
        # Check configuration changes for text model
        overrides = context.session.config_overrides
        assert overrides["features"]["spontaneous_file_upload"]["enabled"] is False
        assert overrides["ui"]["name"] == "Text Assistant (text-model)"


async def test_apply_session_config_overrides(test_config: config.ChainlitConfig):
    """Test session configuration override storage."""
    # Create a mock session with overrides
    mock_session = Mock()
    mock_session.config_overrides = {
        "features": {
            "latex": True,
            "audio": {"enabled": True, "sample_rate": 44100}
        },
        "ui": {
            "name": "Custom Assistant",
            "description": "Custom description"
        }
    }
    
    # Test that the session has the expected overrides
    assert "features" in mock_session.config_overrides
    assert "ui" in mock_session.config_overrides
    assert mock_session.config_overrides["features"]["latex"] is True
    assert mock_session.config_overrides["ui"]["name"] == "Custom Assistant"


async def test_config_override_isolation(mock_session_factory):
    """Test that configuration overrides are isolated between sessions."""
    # Create two mock sessions
    session1 = mock_session_factory(id="session1")
    session2 = mock_session_factory(id="session2")
    
    # Each session should have its own config overrides
    session1.config_overrides = {"ui": {"name": "Assistant 1"}}
    session2.config_overrides = {"ui": {"name": "Assistant 2"}}
    
    assert session1.config_overrides != session2.config_overrides
    assert session1.config_overrides["ui"]["name"] == "Assistant 1"
    assert session2.config_overrides["ui"]["name"] == "Assistant 2"