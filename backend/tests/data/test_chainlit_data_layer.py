import json
from datetime import datetime
from unittest.mock import AsyncMock

import pytest

from chainlit import User
from chainlit.data.chainlit_data_layer import ChainlitDataLayer
from chainlit.types import Pagination, ThreadFilter


@pytest.mark.asyncio
async def test_update_thread_preserves_metadata_when_none():
    """Test that update_thread does not overwrite existing metadata when metadata=None."""
    # Create a mock data layer
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    # Mock the execute_query method
    data_layer.execute_query = AsyncMock()

    # Simulate calling update_thread with only a name, metadata=None (default)
    await data_layer.update_thread(thread_id="test-thread-123", name="Updated Name")

    # Verify execute_query was called
    assert data_layer.execute_query.called

    # Get the query and params from the call
    call_args = data_layer.execute_query.call_args
    query = call_args[0][0]
    params = call_args[0][1]

    # The query should NOT include metadata in the update
    # because metadata was None and should be excluded from the data dict
    assert "metadata" not in query.lower()
    assert "metadata" not in str(params.values())


@pytest.mark.asyncio
async def test_update_thread_merges_metadata_when_provided():
    """Test that update_thread merges metadata correctly when provided."""
    # Create a mock data layer
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    # Mock the execute_query method to return existing metadata
    existing_metadata = {"is_shared": True, "custom_field": "original"}

    async def mock_execute_query(query, params):
        if "SELECT" in query and "metadata" in query:
            # Return existing thread metadata
            return [{"metadata": json.dumps(existing_metadata)}]
        # For the UPDATE/INSERT, return None
        return None

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    # Call update_thread with partial metadata update
    new_metadata = {"custom_field": "updated", "new_field": "added"}
    await data_layer.update_thread(
        thread_id="test-thread-123", name="Updated Name", metadata=new_metadata
    )

    # Verify execute_query was called twice (once for SELECT, once for UPDATE)
    assert data_layer.execute_query.call_count == 2

    # Get the UPDATE call
    update_call = data_layer.execute_query.call_args_list[1]
    update_params = update_call[0][1]

    # The metadata should be merged
    # Expected: {"is_shared": True, "custom_field": "updated", "new_field": "added"}
    # Find the JSON metadata in the params
    metadata_json = None
    for value in update_params.values():
        if isinstance(value, str) and value.startswith("{"):
            try:
                metadata_json = json.loads(value)
                break
            except json.JSONDecodeError:
                pass

    assert metadata_json is not None
    assert metadata_json.get("is_shared") is True
    assert metadata_json.get("custom_field") == "updated"
    assert metadata_json.get("new_field") == "added"


@pytest.mark.asyncio
async def test_update_thread_deletes_keys_with_none_values():
    """Test that update_thread deletes keys when value is None."""
    # Create a mock data layer
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    # Mock the execute_query method to return existing metadata
    existing_metadata = {
        "is_shared": True,
        "to_delete": "will be removed",
        "keep": "stays",
    }

    async def mock_execute_query(query, params):
        if "SELECT" in query and "metadata" in query:
            # Return existing thread metadata
            return [{"metadata": json.dumps(existing_metadata)}]
        # For the UPDATE/INSERT, return None
        return None

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    # Call update_thread with None value to delete a key
    new_metadata = {"to_delete": None, "new_field": "added"}
    await data_layer.update_thread(thread_id="test-thread-123", metadata=new_metadata)

    # Verify execute_query was called twice
    assert data_layer.execute_query.call_count == 2

    # Get the UPDATE call
    update_call = data_layer.execute_query.call_args_list[1]
    update_params = update_call[0][1]

    # The metadata should have deleted "to_delete" key and added "new_field"
    # Expected: {"is_shared": True, "keep": "stays", "new_field": "added"}
    metadata_json = None
    for value in update_params.values():
        if isinstance(value, str) and value.startswith("{"):
            try:
                metadata_json = json.loads(value)
                break
            except json.JSONDecodeError:
                pass

    if metadata_json:
        # Verify "to_delete" is not in the merged metadata
        assert "to_delete" not in metadata_json
        # Verify "new_field" was added
        assert metadata_json.get("new_field") == "added"
        # Verify "is_shared" and "keep" are preserved
        assert metadata_json.get("is_shared") is True
        assert metadata_json.get("keep") == "stays"


@pytest.mark.asyncio
async def test_get_user_returns_iso_format_with_z_suffix():
    """Test that get_user returns createdAt with 'Z' suffix for chainlit/utils.py utc_now() compliance."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    mock_created_at = datetime(2024, 1, 15, 10, 30, 45, 123456)

    async def mock_execute_query(query, params):
        if "SELECT" in query and "User" in query:
            return [
                {
                    "id": "user-123",
                    "identifier": "test@example.com",
                    "createdAt": mock_created_at,
                    "metadata": "{}",
                }
            ]
        return []

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    result = await data_layer.get_user("test@example.com")

    assert result is not None
    assert result.id == "user-123"
    assert result.identifier == "test@example.com"
    assert result.createdAt == "2024-01-15T10:30:45.123456Z"


@pytest.mark.asyncio
async def test_create_user_returns_iso_format_with_z_suffix():
    """Test that create_user returns createdAt with 'Z' suffix for chainlit/utils.py utc_now() compliance."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    mock_created_at = datetime(2024, 1, 15, 10, 30, 45, 123456)

    async def mock_execute_query(query, params):
        if "INSERT" in query and "User" in query:
            return [
                {
                    "id": "user-456",
                    "identifier": "newuser@example.com",
                    "createdAt": mock_created_at,
                    "metadata": '{"role": "admin"}',
                }
            ]
        return []

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)
    data_layer.get_current_timestamp = AsyncMock(return_value=mock_created_at)

    user = User(identifier="newuser@example.com", metadata={"role": "admin"})

    result = await data_layer.create_user(user)

    assert result is not None
    assert result.id == "user-456"
    assert result.identifier == "newuser@example.com"
    assert result.createdAt == "2024-01-15T10:30:45.123456Z"


@pytest.mark.asyncio
async def test_list_threads_returns_iso_format_with_z_suffix():
    """Test that list_threads returns createdAt with 'Z' suffix for chainlit/utils.py utc_now() compliance."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )
    mock_updated_at = datetime(2024, 2, 20, 14, 15, 30, 987654)

    async def mock_execute_query(query, params):
        if "SELECT" in query and "Thread" in query:
            return [
                {
                    "id": "thread-789",
                    "name": "Test Thread",
                    "userId": "user-123",
                    "user_identifier": "test@example.com",
                    "updatedAt": mock_updated_at,
                    "metadata": "{}",
                    "total": 1,
                }
            ]
        return []

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    pagination = Pagination(first=10, cursor=None)
    filters = ThreadFilter(userId=None, search=None, feedback=None)

    result = await data_layer.list_threads(pagination, filters)

    assert result is not None
    assert len(result.data) == 1
    thread = result.data[0]
    assert thread["id"] == "thread-789"
    assert thread["createdAt"] == "2024-02-20T14:15:30.987654Z"


@pytest.mark.asyncio
async def test_get_thread_returns_iso_format_with_z_suffix():
    """Test that get_thread returns createdAt with 'Z' suffix for chainlit/utils.py utc_now() compliance."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )
    mock_created_at = datetime(2024, 3, 10, 9, 20, 15, 456789)

    async def mock_execute_query(query, params):
        if "SELECT t.*" in query and "Thread" in query:
            return [
                {
                    "id": "thread-101",
                    "name": "Single Thread",
                    "userId": "user-456",
                    "user_identifier": "user@example.com",
                    "createdAt": mock_created_at,
                    "metadata": "{}",
                }
            ]
        return []

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    result = await data_layer.get_thread("thread-101")

    assert result is not None
    assert result["id"] == "thread-101"
    assert result["createdAt"] == "2024-03-10T09:20:15.456789Z"


@pytest.mark.asyncio
async def test_convert_step_row_to_dict_returns_iso_format_with_z_suffix():
    """Test that _convert_step_row_to_dict returns timestamps with 'Z' suffix for chainlit/utils.py utc_now() compliance."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    mock_created_at = datetime(2024, 4, 5, 12, 0, 0, 111111)
    mock_start_time = datetime(2024, 4, 5, 12, 0, 5, 222222)
    mock_end_time = datetime(2024, 4, 5, 12, 0, 10, 333333)

    mock_row = {
        "id": "step-202",
        "threadId": "thread-303",
        "parentId": None,
        "name": "Test Step",
        "type": "user_message",
        "input": {"content": "Hello"},
        "output": {"response": "Hi there"},
        "metadata": "{}",
        "createdAt": mock_created_at,
        "startTime": mock_start_time,
        "endTime": mock_end_time,
        "showInput": "json",
        "isError": False,
        "feedback_id": None,
    }

    result = data_layer._convert_step_row_to_dict(mock_row)

    assert result is not None
    assert result["id"] == "step-202"
    assert result["createdAt"] == "2024-04-05T12:00:00.111111Z"
    assert result["start"] == "2024-04-05T12:00:05.222222Z"
    assert result["end"] == "2024-04-05T12:00:10.333333Z"


@pytest.mark.asyncio
async def test_convert_step_row_to_dict_handles_none_timestamps():
    """Test that _convert_step_row_to_dict handles None timestamps correctly."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    mock_row = {
        "id": "step-303",
        "threadId": "thread-404",
        "parentId": None,
        "name": "Test Step",
        "type": "user_message",
        "input": {},
        "output": {},
        "metadata": "{}",
        "createdAt": None,
        "startTime": None,
        "endTime": None,
        "showInput": "json",
        "isError": False,
        "feedback_id": None,
    }

    result = data_layer._convert_step_row_to_dict(mock_row)

    assert result is not None
    assert result["id"] == "step-303"
    assert result["createdAt"] is None
    assert result["start"] is None
    assert result["end"] is None
