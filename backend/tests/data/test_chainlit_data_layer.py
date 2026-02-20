import json

import pytest

from chainlit.data.chainlit_data_layer import ChainlitDataLayer


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
        from unittest.mock import AsyncMock

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
        from unittest.mock import AsyncMock

        layer = self._make_layer()
        layer.execute_query = AsyncMock(return_value=[])
        result = await layer.get_element("thread-1", "nonexistent")
        assert result is None
