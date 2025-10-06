"""Tests for ChainlitDataLayer metadata handling."""

import json
from unittest.mock import AsyncMock, patch

import pytest

from chainlit.data.chainlit_data_layer import ChainlitDataLayer


@pytest.fixture
def mock_pool():
    """Mock asyncpg connection pool."""
    return AsyncMock()


@pytest.fixture
def data_layer(mock_pool):
    """Create ChainlitDataLayer instance with mocked pool."""
    layer = ChainlitDataLayer("postgresql://test", show_logger=False)
    layer.pool = mock_pool
    return layer


@pytest.mark.asyncio
async def test_update_thread_metadata_none_preserves_existing(data_layer):
    """Test that passing metadata=None doesn't overwrite existing metadata."""
    thread_id = "test_thread_123"
    existing_metadata = {"key1": "value1", "key2": "value2"}

    # Mock get_thread to return existing thread with metadata
    mock_thread = {"id": thread_id, "metadata": json.dumps(existing_metadata)}

    with patch.object(data_layer, "get_thread", return_value=mock_thread):
        with patch.object(data_layer, "execute_query", return_value=[]) as mock_execute:
            # Call update_thread with metadata=None (default)
            await data_layer.update_thread(thread_id=thread_id, name="Test Thread")

            # Verify execute_query was called
            assert mock_execute.called

            # Get the query and parameters that were passed
            call_args = mock_execute.call_args
            query = call_args[0][0]

            # The query should NOT include metadata field when metadata=None
            assert "metadata" not in query.lower()


@pytest.mark.asyncio
async def test_update_thread_metadata_merges_with_existing(data_layer):
    """Test that new metadata is sent to PostgreSQL for atomic merging."""
    thread_id = "test_thread_456"
    new_metadata = {"key1": "new_value", "key3": "added"}

    # Capture the actual SQL parameters that would be passed
    captured_params = {}
    captured_query = ""

    def capture_execute_query(query: str, params=None):
        nonlocal captured_params, captured_query
        captured_params = params or {}
        captured_query = query
        return []

    with patch.object(
        data_layer, "execute_query", side_effect=capture_execute_query
    ) as mock_execute:
        # Call update_thread with new metadata
        await data_layer.update_thread(thread_id=thread_id, metadata=new_metadata)

        # Verify execute_query was called
        assert mock_execute.called

        # Verify the query uses PostgreSQL's atomic JSON merge operator
        assert "|| EXCLUDED.metadata::jsonb" in captured_query

        # Verify only the new metadata is sent (not pre-merged)
        metadata_json = None
        for key, value in captured_params.items():
            if isinstance(value, str) and (value.startswith("{") or value == "{}"):
                metadata_json = value
                break

        assert metadata_json is not None, (
            f"No JSON metadata found in params: {captured_params}"
        )
        metadata_param = json.loads(metadata_json)

        # Verify only the new metadata is sent to PostgreSQL (merging happens DB-side)
        assert metadata_param == new_metadata


@pytest.mark.asyncio
async def test_update_thread_metadata_empty_dict_updates(data_layer):
    """Test that passing empty dict {} gets sent to PostgreSQL for atomic merging."""
    thread_id = "test_thread_789"
    new_metadata = {}

    # Capture the actual SQL parameters that would be passed
    captured_params = {}
    captured_query = ""

    def capture_execute_query(query: str, params=None):
        nonlocal captured_params, captured_query
        captured_params = params or {}
        captured_query = query
        return []

    with patch.object(
        data_layer, "execute_query", side_effect=capture_execute_query
    ) as mock_execute:
        # Call update_thread with empty metadata dict
        await data_layer.update_thread(thread_id=thread_id, metadata=new_metadata)

        # Verify execute_query was called
        assert mock_execute.called

        # Verify the query uses PostgreSQL's atomic JSON merge operator
        assert "|| EXCLUDED.metadata::jsonb" in captured_query

        # Find the metadata parameter
        metadata_json = None
        for key, value in captured_params.items():
            if isinstance(value, str) and (value.startswith("{") or value == "{}"):
                metadata_json = value
                break

        assert metadata_json is not None, (
            f"No JSON metadata found in params: {captured_params}"
        )
        metadata_param = json.loads(metadata_json)

        # Verify the empty dict is sent to PostgreSQL (which will merge with existing)
        assert metadata_param == new_metadata


@pytest.mark.asyncio
async def test_update_thread_metadata_no_existing_thread(data_layer):
    """Test that metadata works correctly when no existing thread."""
    thread_id = "test_thread_new"
    new_metadata = {"key1": "value1", "key2": "value2"}

    # Capture the actual SQL parameters that would be passed
    captured_params = {}

    def capture_execute_query(query: str, params=None):
        nonlocal captured_params
        captured_params = params or {}
        return []

    # Mock get_thread to return None (no existing thread)
    with patch.object(data_layer, "get_thread", return_value=None):
        with patch.object(
            data_layer, "execute_query", side_effect=capture_execute_query
        ) as mock_execute:
            # Call update_thread with new metadata
            await data_layer.update_thread(thread_id=thread_id, metadata=new_metadata)

            # Verify execute_query was called
            assert mock_execute.called

            # Find the metadata parameter
            metadata_json = None
            for key, value in captured_params.items():
                if isinstance(value, str) and (value.startswith("{") or value == "{}"):
                    metadata_json = value
                    break

            assert metadata_json is not None, (
                f"No JSON metadata found in params: {captured_params}"
            )
            metadata_param = json.loads(metadata_json)

            # Verify the new metadata was stored as-is
            assert metadata_param == new_metadata


@pytest.mark.asyncio
async def test_update_thread_metadata_corrupted_existing_fallback(data_layer):
    """Test fallback behavior when existing metadata is corrupted."""
    thread_id = "test_thread_corrupted"
    new_metadata = {"key1": "value1"}

    # Mock get_thread to return thread with corrupted metadata
    mock_thread = {"id": thread_id, "metadata": "invalid_json_string"}

    # Capture the actual SQL parameters that would be passed
    captured_params = {}

    def capture_execute_query(query: str, params=None):
        nonlocal captured_params
        captured_params = params or {}
        return []

    with patch.object(data_layer, "get_thread", return_value=mock_thread):
        with patch.object(
            data_layer, "execute_query", side_effect=capture_execute_query
        ) as mock_execute:
            # Call update_thread with new metadata
            await data_layer.update_thread(thread_id=thread_id, metadata=new_metadata)

            # Verify execute_query was called
            assert mock_execute.called

            # Find the metadata parameter
            metadata_json = None
            for key, value in captured_params.items():
                if isinstance(value, str) and (value.startswith("{") or value == "{}"):
                    metadata_json = value
                    break

            assert metadata_json is not None, (
                f"No JSON metadata found in params: {captured_params}"
            )
            metadata_param = json.loads(metadata_json)

            # Should fallback to just the new metadata
            assert metadata_param == new_metadata
