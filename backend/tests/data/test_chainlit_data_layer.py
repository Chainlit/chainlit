import json
from unittest.mock import AsyncMock

import pytest

from chainlit.data.chainlit_data_layer import ChainlitDataLayer


@pytest.mark.asyncio
async def test_update_thread_preserves_metadata_when_none_existing_thread():
    """Test that update_thread preserves existing metadata when metadata=None on an existing thread."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    existing_metadata = {"important": "data", "keep": "me"}

    async def mock_execute_query(query, params):
        if "SELECT" in query and "metadata" in query:
            return [{"metadata": json.dumps(existing_metadata)}]
        return None

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    await data_layer.update_thread(thread_id="test-thread-123", name="Updated Name")

    assert data_layer.execute_query.call_count == 2

    update_call = data_layer.execute_query.call_args_list[1]
    update_params = update_call[0][1]

    metadata_json = None
    for value in update_params.values():
        if isinstance(value, str) and value.startswith("{"):
            try:
                metadata_json = json.loads(value)
                break
            except json.JSONDecodeError:
                pass

    assert metadata_json == existing_metadata


@pytest.mark.asyncio
async def test_update_thread_noop_skips_upsert_on_existing_thread():
    """Test that update_thread with no arguments early-returns for an existing thread."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    async def mock_execute_query(query, params):
        if "SELECT" in query and "metadata" in query:
            return [{"metadata": json.dumps({"existing": "data"})}]
        return None

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    await data_layer.update_thread(thread_id="test-thread-123")

    assert data_layer.execute_query.call_count == 1


@pytest.mark.asyncio
async def test_update_thread_new_thread_includes_empty_metadata():
    """Test that update_thread includes metadata='{}' for a new thread (NOT NULL safe)."""
    data_layer = ChainlitDataLayer(
        database_url="postgresql://test", storage_client=None, show_logger=False
    )

    async def mock_execute_query(query, params):
        if "SELECT" in query and "metadata" in query:
            return []
        return None

    data_layer.execute_query = AsyncMock(side_effect=mock_execute_query)

    await data_layer.update_thread(thread_id="new-thread", name="New Chat")

    assert data_layer.execute_query.call_count == 2

    update_call = data_layer.execute_query.call_args_list[1]
    update_query = update_call[0][0]
    update_params = update_call[0][1]

    assert "metadata" in update_query.lower()

    metadata_json = None
    for value in update_params.values():
        if isinstance(value, str) and value.startswith("{"):
            try:
                metadata_json = json.loads(value)
                break
            except json.JSONDecodeError:
                pass

    assert metadata_json == {}


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
async def test_create_step_uses_nullif_for_output_and_input():
    """Empty-string output/input should not overwrite existing content.

    Regression test for https://github.com/Chainlit/chainlit/issues/2789
    The SQL uses NULLIF(EXCLUDED.output, '') so that an empty string from the
    initial Step.send() is treated as NULL by COALESCE, preventing it from
    overwriting non-empty content saved by a subsequent Step.update().
    """
    import inspect

    source = inspect.getsource(ChainlitDataLayer.create_step)

    assert "NULLIF(EXCLUDED.output, '')" in source, (
        "output should use NULLIF to treat empty string as NULL"
    )
    assert "NULLIF(EXCLUDED.input, '')" in source, (
        "input should use NULLIF to treat empty string as NULL"
    )
