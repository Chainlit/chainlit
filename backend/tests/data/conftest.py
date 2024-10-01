from unittest.mock import AsyncMock

import pytest
from chainlit.data.storage_clients.base import BaseStorageClient


@pytest.fixture
def mock_storage_client():
    mock_client = AsyncMock(spec=BaseStorageClient)
    mock_client.upload_file.return_value = {
        "url": "https://example.com/test.txt",
        "object_key": "test_user/test_element/test.txt",
    }
    return mock_client
