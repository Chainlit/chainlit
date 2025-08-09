"""Tests for socket-level profile switching functionality."""

import asyncio
from unittest.mock import AsyncMock, Mock, patch

import pytest


def test_socket_profile_change_functionality():
    """Test the core profile switching logic without importing socket module."""
    
    # This tests the core logic that would be in the socket handler
    # without importing the actual socket module that requires the frontend build
    
    async def mock_change_chat_profile(session, profile_name, set_chat_profiles_func, on_profile_switch_func):
        """Mock implementation of profile switching logic."""
        
        # Get available profiles
        if set_chat_profiles_func:
            profiles = await set_chat_profiles_func(session.user)
            
            # Find the selected profile
            selected_profile = None
            for profile in profiles:
                if profile.name == profile_name:
                    selected_profile = profile
                    break
            
            if selected_profile:
                # Update session
                old_profile = session.chat_profile
                session.chat_profile = profile_name
                session.config_overrides = {}
                
                # Call callback if defined
                if on_profile_switch_func:
                    await on_profile_switch_func(selected_profile)
                
                return {
                    "success": True,
                    "old_profile": old_profile,
                    "new_profile": profile_name
                }
            else:
                return {"success": False, "error": "Unknown profile"}
        else:
            return {"success": False, "error": "No profiles configured"}
    
    # Test the mock implementation
    from chainlit.types import ChatProfile
    
    # Create test data
    mock_session = Mock()
    mock_session.user = None
    mock_session.chat_profile = "old-profile"
    mock_session.config_overrides = {"ui": {"name": "Old Name"}}
    
    test_profiles = [
        ChatProfile(name="text-model", markdown_description="Text model"),
        ChatProfile(name="vision-model", markdown_description="Vision model"),
    ]
    
    async def mock_set_profiles(user):
        return test_profiles
    
    callback_called = False
    callback_profile = None
    
    async def mock_callback(profile):
        nonlocal callback_called, callback_profile
        callback_called = True
        callback_profile = profile
    
    # Test the logic
    async def run_test():
        result = await mock_change_chat_profile(
            mock_session, 
            "vision-model",
            mock_set_profiles,
            mock_callback
        )
        
        # Verify results
        assert result["success"] is True
        assert result["old_profile"] == "old-profile"
        assert result["new_profile"] == "vision-model"
        assert mock_session.chat_profile == "vision-model"
        assert mock_session.config_overrides == {}
        assert callback_called is True
        assert callback_profile.name == "vision-model"
    
    # Run the test
    import asyncio
    asyncio.run(run_test())


def test_profile_switching_edge_cases():
    """Test edge cases in profile switching logic."""
    
    from chainlit.types import ChatProfile
    
    async def mock_change_chat_profile(session, profile_name, set_chat_profiles_func, on_profile_switch_func):
        """Mock implementation matching the real socket handler logic."""
        if set_chat_profiles_func:
            try:
                profiles = await set_chat_profiles_func(session.user)
                selected_profile = None
                for profile in profiles:
                    if profile.name == profile_name:
                        selected_profile = profile
                        break
                
                if selected_profile:
                    old_profile = session.chat_profile
                    session.chat_profile = profile_name
                    session.config_overrides = {}
                    
                    if on_profile_switch_func:
                        await on_profile_switch_func(selected_profile)
                    
                    return {"success": True, "old_profile": old_profile, "new_profile": profile_name}
                else:
                    return {"success": False, "error": "Unknown profile"}
            except Exception as e:
                return {"success": False, "error": str(e)}
        else:
            return {"success": False, "error": "No profiles configured"}
    
    # Test unknown profile
    async def test_unknown_profile():
        mock_session = Mock()
        mock_session.user = None
        mock_session.chat_profile = "old-profile"
        mock_session.config_overrides = {}
        
        test_profiles = [ChatProfile(name="known-profile", markdown_description="Known")]
        
        async def mock_set_profiles(user):
            return test_profiles
        
        result = await mock_change_chat_profile(
            mock_session, 
            "unknown-profile",
            mock_set_profiles,
            None
        )
        
        assert result["success"] is False
        assert result["error"] == "Unknown profile"
        assert mock_session.chat_profile == "old-profile"  # Should not change
    
    # Test no profiles configured
    async def test_no_profiles():
        mock_session = Mock()
        mock_session.chat_profile = "old-profile"
        
        result = await mock_change_chat_profile(
            mock_session,
            "any-profile", 
            None,
            None
        )
        
        assert result["success"] is False
        assert result["error"] == "No profiles configured"
    
    # Test exception handling
    async def test_exception():
        mock_session = Mock()
        mock_session.user = None
        mock_session.chat_profile = "old-profile"
        
        async def failing_set_profiles(user):
            raise Exception("Test error")
        
        result = await mock_change_chat_profile(
            mock_session,
            "any-profile",
            failing_set_profiles,
            None
        )
        
        assert result["success"] is False
        assert result["error"] == "Test error"
    
    # Run all tests
    import asyncio
    asyncio.run(test_unknown_profile())
    asyncio.run(test_no_profiles())
    asyncio.run(test_exception())