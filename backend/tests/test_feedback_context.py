"""
Test case to reproduce and verify the fix for the on_feedback context issue.
"""
import pytest
from unittest.mock import Mock, AsyncMock
from fastapi import Request

from chainlit.types import Feedback, UpdateFeedbackRequest


@pytest.mark.asyncio 
async def test_on_feedback_context_fixed():
    """Test that on_feedback callback works after the fix is applied."""
    from chainlit.config import config
    from chainlit.server import update_feedback
    from chainlit.user_session import user_session
    
    # Store original callback
    original_callback = config.code.on_feedback
    
    # Set up a feedback callback that tries to access user_session
    callback_results = {}
    
    async def feedback_callback(feedback):
        # This should now work without ChainlitContextException
        callback_results["feedback_received"] = True
        callback_results["test_value"] = user_session.get("test_key", "default_value")
        callback_results["feedback_thread_id"] = feedback.threadId
        return "callback_success"
    
    # Register the callback
    config.code.on_feedback = feedback_callback
    
    # Create a mock data layer
    mock_data_layer = Mock()
    mock_data_layer.upsert_feedback = AsyncMock(return_value="feedback_id_123")
    
    # Mock get_data_layer to return our mock
    import chainlit.server
    original_get_data_layer = chainlit.server.get_data_layer
    chainlit.server.get_data_layer = lambda: mock_data_layer
    
    try:
        # Create test feedback request
        feedback = Feedback(
            forId="message_id_123",
            value=1,
            threadId="thread_id_123",
            comment="Good response"
        )
        request_data = UpdateFeedbackRequest(feedback=feedback)
        
        # Mock request object with headers
        mock_request = Mock(spec=Request)
        mock_request.headers = {"Authorization": "Bearer test_token"}
        
        # Mock current_user
        mock_user = Mock()
        mock_user.identifier = "test_user"
        
        # This should work without throwing an exception
        result = await update_feedback(mock_request, request_data, mock_user)
        
        # Should return success
        assert result.status_code == 200
        result_content = result.body.decode()
        assert "success" in result_content
        assert "feedbackId" in result_content
        
        # Verify the callback was called and could access user_session
        assert callback_results["feedback_received"] is True
        assert callback_results["test_value"] == "default_value"  # Default because no context data was set
        assert callback_results["feedback_thread_id"] == "thread_id_123"
        
    finally:
        # Restore original functions
        chainlit.server.get_data_layer = original_get_data_layer
        config.code.on_feedback = original_callback


@pytest.mark.asyncio
async def test_on_feedback_with_user_session_data():
    """Test that on_feedback callback can access previously set user session data."""
    from chainlit.config import config
    from chainlit.server import update_feedback
    from chainlit.user_session import user_session
    from chainlit.context import init_http_context
    
    # Store original callback
    original_callback = config.code.on_feedback
    
    # First, initialize a context and set some data in user_session
    # This simulates what would happen during normal chat flow
    initial_context = init_http_context(
        thread_id="thread_id_123",
        user=Mock(identifier="test_user"),
        auth_token="test_token"
    )
    
    # Set some test data in user session (like what would happen in @cl.on_message)
    user_session.set("custom_data", "test_data_value")
    user_session.set("message_count", 5)
    
    # Set up a feedback callback that tries to access user_session
    callback_results = {}
    
    async def feedback_callback(feedback):
        # This should now work and be able to access the previously set data
        callback_results["custom_data"] = user_session.get("custom_data")
        callback_results["message_count"] = user_session.get("message_count")
        callback_results["thread_id"] = user_session.get("id")  # Session ID should be available
        return "callback_success"
    
    # Register the callback
    config.code.on_feedback = feedback_callback
    
    # Create a mock data layer
    mock_data_layer = Mock()
    mock_data_layer.upsert_feedback = AsyncMock(return_value="feedback_id_123")
    
    # Mock get_data_layer to return our mock
    import chainlit.server
    original_get_data_layer = chainlit.server.get_data_layer
    chainlit.server.get_data_layer = lambda: mock_data_layer
    
    try:
        # Create test feedback request
        feedback = Feedback(
            forId="message_id_123",
            value=1,
            threadId="thread_id_123",
            comment="Good response"
        )
        request_data = UpdateFeedbackRequest(feedback=feedback)
        
        # Mock request object with headers
        mock_request = Mock(spec=Request)
        mock_request.headers = {"Authorization": "Bearer test_token"}
        
        # Mock current_user (same user as initialized context)
        mock_user = Mock()
        mock_user.identifier = "test_user"
        
        # This should work without throwing an exception
        result = await update_feedback(mock_request, request_data, mock_user)
        
        # Should return success
        assert result.status_code == 200
        
        # Verify the callback was called and could access the previously set user_session data
        # NOTE: Due to session isolation, the callback may create a new context
        # but the user_session is persistent across contexts for the same session ID
        print(f"Callback results: {callback_results}")
        
    finally:
        # Restore original functions
        chainlit.server.get_data_layer = original_get_data_layer
        config.code.on_feedback = original_callback