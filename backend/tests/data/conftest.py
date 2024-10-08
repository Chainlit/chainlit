import pytest

from unittest.mock import AsyncMock

from chainlit.data.base import BaseStorageClient
from chainlit.user import User


@pytest.fixture
def mock_storage_client():
    mock_client = AsyncMock(spec=BaseStorageClient)
    mock_client.upload_file.return_value = {
        "url": "https://example.com/test.txt",
        "object_key": "test_user/test_element/test.txt",
    }
    return mock_client


@pytest.fixture
def test_user() -> User:
    return User(identifier="test_user_identifier", metadata={})
