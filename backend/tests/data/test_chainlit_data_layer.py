import json
from unittest.mock import AsyncMock

import pytest

from chainlit.data.chainlit_data_layer import ChainlitDataLayer
from chainlit.data.dynamodb import DynamoDBDataLayer


class TestConvertElementRowToDict:
    """Test suite for ChainlitDataLayer._convert_element_row_to_dict."""

    def _make_layer(self):
        return ChainlitDataLayer(database_url="postgresql://fake", storage_client=None)

    def _make_row(self, **overrides):
        row = {
            "id": "elem-1",
            "threadId": "thread-1",
            "stepId": "step-1",
            "metadata": json.dumps({"type": "file"}),
            "url": None,
            "name": "test_file.txt",
            "mime": "text/plain",
            "objectKey": None,
            "chainlitKey": None,
            "display": "inline",
            "size": None,
            "language": None,
            "page": None,
            "autoPlay": None,
            "playerConfig": None,
            "props": "{}",
        }
        row.update(overrides)
        return row

    def test_convert_element_row_with_none_url(self):
        layer = self._make_layer()
        result = layer._convert_element_row_to_dict(self._make_row(url=None))
        assert result["url"] is None

    def test_convert_element_row_with_none_object_key(self):
        layer = self._make_layer()
        result = layer._convert_element_row_to_dict(self._make_row(objectKey=None))
        assert result["objectKey"] is None

    def test_convert_element_row_with_valid_url(self):
        layer = self._make_layer()
        result = layer._convert_element_row_to_dict(
            self._make_row(url="https://storage.example.com/file.txt")
        )
        assert result["url"] == "https://storage.example.com/file.txt"

    def test_convert_element_row_preserves_chainlit_key(self):
        layer = self._make_layer()
        result = layer._convert_element_row_to_dict(
            self._make_row(chainlitKey="file-abc-123")
        )
        assert result["chainlitKey"] == "file-abc-123"

    def test_convert_element_row_type_from_metadata(self):
        layer = self._make_layer()
        result = layer._convert_element_row_to_dict(
            self._make_row(metadata=json.dumps({"type": "image"}))
        )
        assert result["type"] == "image"

    def test_convert_element_row_default_type(self):
        layer = self._make_layer()
        result = layer._convert_element_row_to_dict(
            self._make_row(metadata=json.dumps({}))
        )
        assert result["type"] == "file"

    def test_convert_element_row_full_data(self):
        layer = self._make_layer()
        result = layer._convert_element_row_to_dict(
            self._make_row(
                url="https://storage.example.com/file.txt",
                objectKey="threads/thread-1/files/elem-1",
                chainlitKey="file-abc-123",
                display="side",
                size="large",
                language="python",
                page=3,
                mime="application/pdf",
                props=json.dumps({"custom": "value"}),
            )
        )
        assert result["id"] == "elem-1"
        assert result["url"] == "https://storage.example.com/file.txt"
        assert result["objectKey"] == "threads/thread-1/files/elem-1"
        assert result["chainlitKey"] == "file-abc-123"
        assert result["props"] == {"custom": "value"}


class TestGetElementNoneHandling:
    """Test that get_element does not convert None values to 'None' strings."""

    def _make_layer(self):
        return ChainlitDataLayer(database_url="postgresql://fake", storage_client=None)

    @pytest.mark.asyncio
    async def test_get_element_returns_none_url_not_string(self):
        layer = self._make_layer()
        layer.execute_query = AsyncMock(
            return_value=[
                {
                    "id": "elem-1",
                    "threadId": "thread-1",
                    "stepId": "step-1",
                    "metadata": json.dumps({"type": "file"}),
                    "url": None,
                    "name": "test.txt",
                    "mime": None,
                    "objectKey": None,
                    "chainlitKey": "ck-1",
                    "display": "inline",
                    "size": None,
                    "language": None,
                    "page": None,
                    "autoPlay": None,
                    "playerConfig": None,
                    "props": "{}",
                }
            ]
        )
        result = await layer.get_element("thread-1", "elem-1")
        assert result is not None
        assert result["url"] is None
        assert result["objectKey"] is None
        assert result["mime"] is None

    @pytest.mark.asyncio
    async def test_get_element_not_found(self):
        layer = self._make_layer()
        layer.execute_query = AsyncMock(return_value=[])
        result = await layer.get_element("thread-1", "nonexistent")
        assert result is None


class _FakeDynamoClient:
    def __init__(self, items):
        self.items = items

    def query(self, **_kwargs):
        return {"Items": self.items}


class _FailingStorageProvider:
    async def get_read_url(self, object_key: str):
        raise RuntimeError(f"failed for {object_key}")


class TestDynamoThreadElementUrlFailure:
    @pytest.mark.asyncio
    async def test_get_thread_tolerates_storage_read_url_error(self):
        bootstrap = DynamoDBDataLayer(
            table_name="test-table", client=_FakeDynamoClient([])
        )

        thread_item = bootstrap._serialize_item(
            {
                "PK": "THREAD#thread-1",
                "SK": "THREAD",
                "id": "thread-1",
                "createdAt": "2026-01-01T00:00:00Z",
                "name": "name",
            }
        )
        element_item = bootstrap._serialize_item(
            {
                "PK": "THREAD#thread-1",
                "SK": "ELEMENT#elem-1",
                "id": "elem-1",
                "objectKey": "threads/thread-1/files/elem-1",
                "type": "file",
                "name": "file.txt",
            }
        )

        layer = DynamoDBDataLayer(
            table_name="test-table",
            client=_FakeDynamoClient([thread_item, element_item]),
            storage_provider=_FailingStorageProvider(),
        )

        thread = await layer.get_thread("thread-1")

        assert thread is not None
        assert thread["id"] == "thread-1"
        assert len(thread["elements"]) == 1
        assert thread["elements"][0]["id"] == "elem-1"


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
