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
        bootstrap = DynamoDBDataLayer(table_name="test-table", client=_FakeDynamoClient([]))

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
