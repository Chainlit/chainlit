from unittest.mock import MagicMock, patch

import pytest

from chainlit.data.storage_clients.base import storage_expiry_time
from chainlit.data.storage_clients.gcs import GCSStorageClient


@pytest.fixture
def mock_gcs_client():
    """Create a mock Google Cloud Storage client."""
    # First mock the service_account
    with patch(
        "chainlit.data.storage_clients.gcs.service_account"
    ) as mock_service_account:
        mock_credentials = MagicMock()
        mock_service_account.Credentials.from_service_account_info.return_value = (
            mock_credentials
        )

        # Then mock the storage client
        with patch("chainlit.data.storage_clients.gcs.storage") as mock_storage:
            mock_client = MagicMock()
            mock_storage.Client.return_value = mock_client
            mock_bucket = MagicMock()
            mock_client.bucket.return_value = mock_bucket
            mock_blob = MagicMock()
            mock_bucket.blob.return_value = mock_blob

            yield {
                "storage": mock_storage,
                "client": mock_client,
                "bucket": mock_bucket,
                "blob": mock_blob,
                "service_account": mock_service_account,
                "credentials": mock_credentials,
            }


class TestGCSStorageClient:
    def test_init(self, mock_gcs_client):
        """Test initialization of GCS client."""
        # Remove client assignment, directly call the constructor
        GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Verify service account credentials were created correctly
        mock_gcs_client[
            "service_account"
        ].Credentials.from_service_account_info.assert_called_once_with(
            {
                "type": "service_account",
                "project_id": "test-project",
                "private_key": "test-key",
                "client_email": "test@example.com",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )

        # Verify storage client was initialized with credentials
        mock_gcs_client["storage"].Client.assert_called_once_with(
            project="test-project", credentials=mock_gcs_client["credentials"]
        )

        # Verify bucket was retrieved
        mock_gcs_client["client"].bucket.assert_called_once_with("test-bucket")

    def test_sync_get_read_url(self, mock_gcs_client):
        """Test generating a signed URL."""
        # Set up the mock to return a URL
        mock_gcs_client[
            "blob"
        ].generate_signed_url.return_value = "https://signed-url.example.com"

        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset mocks to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Test the method
        url = client.sync_get_read_url("test/path/file.txt")

        # Verify correct methods were called
        mock_gcs_client["bucket"].blob.assert_called_once_with("test/path/file.txt")
        mock_gcs_client["blob"].generate_signed_url.assert_called_once_with(
            version="v4", expiration=storage_expiry_time, method="GET"
        )

        assert url == "https://signed-url.example.com"

    @pytest.mark.asyncio
    async def test_get_read_url(self, mock_gcs_client):
        """Test the async wrapper for getting a read URL."""
        # Set up the mock to return a URL
        mock_gcs_client[
            "blob"
        ].generate_signed_url.return_value = "https://signed-url.example.com"

        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset mocks to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Test the async method
        url = await client.get_read_url("test/path/file.txt")

        # Verify correct methods were called
        mock_gcs_client["bucket"].blob.assert_called_once_with("test/path/file.txt")
        mock_gcs_client["blob"].generate_signed_url.assert_called_once_with(
            version="v4", expiration=storage_expiry_time, method="GET"
        )

        assert url == "https://signed-url.example.com"

    def test_sync_upload_file(self, mock_gcs_client):
        """Test uploading a file to GCS."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Mock the bucket name property
        mock_gcs_client["bucket"].name = "test-bucket"

        # Test with binary data
        binary_data = b"test content"
        object_key = "test/path/file.txt"

        # Remove the unused result assignment
        client.sync_upload_file(
            object_key=object_key, data=binary_data, mime="text/plain", overwrite=True
        )

        # Check that the blob was called with the correct object key (using assert_any_call instead of assert_called_once_with)
        mock_gcs_client["bucket"].blob.assert_any_call(object_key)
        mock_gcs_client["blob"].upload_from_string.assert_called_once_with(
            binary_data, content_type="text/plain"
        )

    def test_sync_upload_file_string_data(self, mock_gcs_client):
        """Test uploading string data to GCS."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()
        mock_gcs_client["bucket"].name = "test-bucket"

        # Test with string data that should be encoded
        string_data = "test content"
        object_key = "test/path/file.txt"

        # Remove the unused result assignment
        client.sync_upload_file(
            object_key=object_key, data=string_data, mime="text/plain", overwrite=True
        )

        # Check that the correct methods were called
        mock_gcs_client["bucket"].blob.assert_any_call(object_key)
        mock_gcs_client["blob"].upload_from_string.assert_called_once_with(
            b"test content", content_type="text/plain"
        )

    def test_sync_upload_file_no_overwrite(self, mock_gcs_client):
        """Test upload with overwrite=False and existing file."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Configure blob to indicate file exists
        mock_gcs_client["blob"].exists.return_value = True

        with pytest.raises(
            Exception,
            match="Failed to upload file to GCS: File test/path/existing.txt already exists and overwrite is False",
        ):
            client.sync_upload_file(
                object_key="test/path/existing.txt",
                data=b"test content",
                overwrite=False,
            )

        mock_gcs_client["blob"].exists.assert_called_once()
        mock_gcs_client["blob"].upload_from_string.assert_not_called()

    def test_sync_upload_file_error(self, mock_gcs_client):
        """Test error handling during upload."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Configure upload to throw an exception
        mock_gcs_client["blob"].upload_from_string.side_effect = ValueError(
            "Upload failed"
        )

        with pytest.raises(
            Exception, match="Failed to upload file to GCS: Upload failed"
        ):
            client.sync_upload_file(
                object_key="test/path/file.txt", data=b"test content"
            )

    @pytest.mark.asyncio
    async def test_upload_file(self, mock_gcs_client):
        """Test the async wrapper for uploading a file."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()
        mock_gcs_client["bucket"].name = "test-bucket"

        # Test with binary data
        binary_data = b"test content"
        object_key = "test/path/file.txt"

        # Remove the unused result assignment
        await client.upload_file(
            object_key=object_key, data=binary_data, mime="text/plain", overwrite=True
        )

        # Check that the correct methods were called
        mock_gcs_client["bucket"].blob.assert_any_call(object_key)
        mock_gcs_client["blob"].upload_from_string.assert_called_once_with(
            binary_data, content_type="text/plain"
        )

    def test_sync_delete_file(self, mock_gcs_client):
        """Test deleting a file from GCS."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Test successful delete
        result = client.sync_delete_file("test/path/file.txt")

        mock_gcs_client["bucket"].blob.assert_called_once_with("test/path/file.txt")
        mock_gcs_client["blob"].delete.assert_called_once()
        assert result is True

    def test_sync_delete_file_error(self, mock_gcs_client):
        """Test error handling during file deletion."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Configure delete to throw an exception
        mock_gcs_client["blob"].delete.side_effect = ValueError("Delete failed")

        # The method should catch the exception and return False
        result = client.sync_delete_file("test/path/file.txt")

        mock_gcs_client["bucket"].blob.assert_called_once_with("test/path/file.txt")
        mock_gcs_client["blob"].delete.assert_called_once()
        assert result is False

    @pytest.mark.asyncio
    async def test_delete_file(self, mock_gcs_client):
        """Test the async wrapper for deleting a file."""
        client = GCSStorageClient(
            bucket_name="test-bucket",
            project_id="test-project",
            client_email="test@example.com",
            private_key="test-key",
        )

        # Reset the mock to ensure clean state
        mock_gcs_client["bucket"].reset_mock()
        mock_gcs_client["blob"].reset_mock()

        # Test successful delete
        result = await client.delete_file("test/path/file.txt")

        mock_gcs_client["bucket"].blob.assert_called_once_with("test/path/file.txt")
        mock_gcs_client["blob"].delete.assert_called_once()
        assert result is True
