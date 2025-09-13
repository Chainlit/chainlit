import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from chainlit.auth import get_current_user
from chainlit.data.storage_clients.local import LocalStorageClient
from chainlit.server import app


class TestLocalStorageClient:
    @pytest.fixture
    def temp_storage_dir(self):
        """Create a temporary directory for testing."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            yield Path(tmp_dir)

    @pytest.fixture
    def local_client(self, temp_storage_dir):
        """Create a LocalStorageClient instance with temporary storage."""
        return LocalStorageClient(storage_path=str(temp_storage_dir))

    def test_init(self, temp_storage_dir):
        """Test LocalStorageClient initialization."""
        client = LocalStorageClient(storage_path=str(temp_storage_dir))
        assert client.storage_path == temp_storage_dir.resolve()
        assert client.storage_path.exists()

    @pytest.mark.asyncio
    async def test_upload_file_text(self, local_client, temp_storage_dir):
        """Test uploading a text file."""
        content = "Hello, World!"
        result = await local_client.upload_file("test.txt", content, "text/plain")

        # Check return value
        assert result["object_key"] == "test.txt"
        assert "url" in result

        # Check file was actually written
        file_path = temp_storage_dir / "test.txt"
        assert file_path.exists()
        assert file_path.read_text() == content

    @pytest.mark.asyncio
    async def test_upload_file_bytes(self, local_client, temp_storage_dir):
        """Test uploading binary data."""
        content = b"Binary content here"
        result = await local_client.upload_file(
            "test.bin", content, "application/octet-stream"
        )

        # Check return value
        assert result["object_key"] == "test.bin"

        # Check file was actually written
        file_path = temp_storage_dir / "test.bin"
        assert file_path.exists()
        assert file_path.read_bytes() == content

    @pytest.mark.asyncio
    async def test_upload_file_overwrite_false(self, local_client, temp_storage_dir):
        """Test upload with overwrite=False when file exists."""
        # First upload
        await local_client.upload_file("test.txt", "Original content")

        # Second upload with overwrite=False
        result = await local_client.upload_file(
            "test.txt", "New content", overwrite=False
        )

        # Should return empty dict and not overwrite
        assert result == {}

        file_path = temp_storage_dir / "test.txt"
        assert file_path.read_text() == "Original content"

    @pytest.mark.asyncio
    async def test_get_read_url(self, local_client, temp_storage_dir):
        """Test getting read URL for existing file."""
        # Upload a file first
        await local_client.upload_file("test.txt", "content")

        url = await local_client.get_read_url("test.txt")
        assert url == "/storage/file/test.txt"

    @pytest.mark.asyncio
    async def test_get_read_url_special_characters(
        self, local_client, temp_storage_dir
    ):
        """Test getting read URL for file with special characters."""
        # Upload a file with special characters
        object_key = "folder with spaces/file with spaces.txt"
        await local_client.upload_file(object_key, "content")

        url = await local_client.get_read_url(object_key)
        # URL should be properly encoded
        assert "folder%20with%20spaces/file%20with%20spaces.txt" in url

    @pytest.mark.asyncio
    async def test_url_consistency_upload_and_read(
        self, local_client, temp_storage_dir
    ):
        """Test that URL format is consistent between upload_file and get_read_url."""
        object_key = "test/consistency.txt"
        content = "test content"

        # Upload file and get the URL from upload response
        upload_result = await local_client.upload_file(object_key, content)
        upload_url = upload_result["url"]

        # Get read URL using get_read_url method
        read_url = await local_client.get_read_url(object_key)

        # Both URLs should use the same format (backend's storage route)
        assert upload_url == read_url, (
            f"URL inconsistency: upload={upload_url}, read={read_url}"
        )
        assert upload_url.startswith("/storage/file/"), (
            f"Upload URL should use storage route: {upload_url}"
        )
        assert read_url.startswith("/storage/file/"), (
            f"Read URL should use storage route: {read_url}"
        )

        # Verify URL contains the expected object key
        assert "test/consistency.txt" in upload_url
        assert "test/consistency.txt" in read_url

    @pytest.mark.asyncio
    async def test_download_file(self, local_client, temp_storage_dir):
        """Test downloading file content."""
        content = "File content for download"
        await local_client.upload_file("download_test.txt", content)

        result = await local_client.download_file("download_test.txt")
        assert result is not None

        file_content, mime_type = result
        assert file_content == content.encode()
        assert mime_type == "text/plain"

    @pytest.mark.asyncio
    async def test_delete_file(self, local_client, temp_storage_dir):
        """Test deleting a file."""
        # Upload a file first
        await local_client.upload_file("to_delete.txt", "delete me")
        file_path = temp_storage_dir / "to_delete.txt"
        assert file_path.exists()

        # Delete the file
        result = await local_client.delete_file("to_delete.txt")
        assert result is True
        assert not file_path.exists()

    # Security Tests
    @pytest.mark.asyncio
    async def test_path_traversal_attacks(self, local_client, temp_storage_dir):
        """Test that path traversal attempts are blocked."""
        # Create a file outside storage directory to attempt to access
        outside_file = temp_storage_dir.parent / "secret.txt"
        outside_file.write_text("secret content")

        # Test various path traversal attempts
        path_traversal_attempts = [
            "../secret.txt",
            "../../secret.txt",
            "../../../etc/passwd",
            "/etc/passwd",
            "threads/../../../secret.txt",
            "valid/../../../secret.txt",
            "..\\secret.txt",  # Windows style
            "threads/..\\..\\secret.txt",
        ]

        for malicious_path in path_traversal_attempts:
            # Upload should fail
            result = await local_client.upload_file(malicious_path, "attack")
            assert result == {}, f"Upload should fail for {malicious_path}"

            # Download should fail
            result = await local_client.download_file(malicious_path)
            assert result is None, f"Download should fail for {malicious_path}"

            # Delete should fail
            result = await local_client.delete_file(malicious_path)
            assert result is False, f"Delete should fail for {malicious_path}"

            # get_read_url should return fallback
            result = await local_client.get_read_url(malicious_path)
            assert result == malicious_path, (
                f"get_read_url should return fallback for {malicious_path}"
            )

    @pytest.mark.asyncio
    async def test_path_validation_edge_cases(self, local_client):
        """Test edge cases in path validation."""
        edge_cases = [
            "",  # empty string
            "/",  # root
            "//",  # double slash
            "./file.txt",  # current directory
            "file.txt/../other.txt",  # traversal in middle
            "null\x00byte.txt",  # null byte injection
            "very/deep/nested/../../../attack.txt",  # deep nested traversal
        ]

        for edge_case in edge_cases:
            result = await local_client.upload_file(edge_case, "content")
            # Most should fail, but some like "./file.txt" might be normalized
            if edge_case in ["", "/", "//", "null\x00byte.txt"]:
                assert result == {}, f"Should reject {edge_case}"

    @pytest.mark.asyncio
    async def test_safe_paths_still_work(self, local_client):
        """Test that legitimate paths still work after security fixes."""
        safe_paths = [
            "file.txt",
            "folder/file.txt",
            "deep/nested/folder/file.txt",
            "threads/123/files/456.txt",
            "user_id/element_id.txt",
            "user_id/thread_id/element_id",
            "file with spaces.txt",
            "file-with-dashes_and_underscores.txt",
        ]

        for safe_path in safe_paths:
            # Upload should succeed
            result = await local_client.upload_file(safe_path, "content")
            assert result.get("object_key") == safe_path

            # Download should work
            result = await local_client.download_file(safe_path)
            assert result is not None
            content, mime_type = result
            assert content == b"content"


class TestLocalStorageAPIIntegration:
    """End-to-end integration tests with the FastAPI server."""

    @pytest.fixture
    def temp_storage_dir(self):
        """Create a temporary directory for testing."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            yield Path(tmp_dir)

    @pytest.fixture
    def mock_data_layer(self, temp_storage_dir):
        """Mock the data layer with local storage client."""
        client = LocalStorageClient(storage_path=str(temp_storage_dir))

        data_layer = Mock()
        data_layer.storage_client = client

        with patch("chainlit.data.get_data_layer", return_value=data_layer):
            yield data_layer

    @pytest.fixture
    def test_client(self):
        """Create test client for FastAPI app."""
        return TestClient(app)

    @pytest.fixture
    def mock_user(self):
        """Mock authenticated user."""
        from unittest.mock import Mock

        user = Mock()
        user.id = "test_user"
        user.identifier = "test_user"
        return user

    def test_get_storage_file_success(
        self, test_client, mock_data_layer, temp_storage_dir, mock_user
    ):
        """Test successful file retrieval via API."""
        # Upload a file using the storage client directly
        content = "Test file content"
        storage_client = mock_data_layer.storage_client

        # Use sync method for direct upload in test
        storage_client.sync_upload_file("test.txt", content, "text/plain")

        # Mock authentication
        # Mock the dependency directly in the app
        def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        try:
            response = test_client.get("/storage/file/test.txt")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.text == content
        assert response.headers["content-type"] == "text/plain; charset=utf-8"

    def test_get_storage_file_not_found(self, test_client, mock_data_layer, mock_user):
        """Test file retrieval when file doesn't exist."""

        def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        try:
            response = test_client.get("/storage/file/nonexistent.txt")
            assert response.status_code == 404
            assert "File not found" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_get_storage_file_no_storage_configured(self, test_client, mock_user):
        """Test API behavior when no storage is configured."""

        def mock_get_current_user():
            return mock_user

        def mock_get_data_layer():
            return None

        with patch("chainlit.data.get_data_layer", side_effect=mock_get_data_layer):
            app.dependency_overrides[get_current_user] = mock_get_current_user
            try:
                response = test_client.get("/storage/file/test.txt")
            finally:
                app.dependency_overrides.clear()

        assert response.status_code == 404
        assert "Storage not configured" in response.json()["detail"]

    def test_get_storage_file_storage_no_download_support(self, test_client, mock_user):
        """Test API behavior when storage doesn't support direct downloads."""
        # Mock a storage client that doesn't implement download_file
        mock_storage_client = Mock()
        mock_storage_client.download_file = AsyncMock(return_value=None)

        mock_data_layer = Mock()
        mock_data_layer.storage_client = mock_storage_client

        def mock_get_current_user():
            return mock_user

        with patch("chainlit.data.get_data_layer", return_value=mock_data_layer):
            app.dependency_overrides[get_current_user] = mock_get_current_user
            try:
                response = test_client.get("/storage/file/test.txt")
            finally:
                app.dependency_overrides.clear()

        assert response.status_code == 404
        assert "does not support direct downloads" in response.json()["detail"]

    def test_get_storage_file_path_traversal_blocked(
        self, test_client, mock_data_layer, mock_user
    ):
        """Test that path traversal attempts are blocked at API level."""
        path_traversal_attempts = [
            "../../../etc/passwd",
            "/etc/passwd",
            "threads/../../../secret.txt",
        ]

        def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        try:
            for malicious_path in path_traversal_attempts:
                # URL encode the malicious path
                from urllib.parse import quote

                encoded_path = quote(malicious_path, safe="")

                response = test_client.get(f"/storage/file/{encoded_path}")

                # Should fail - either 400 (bad request), 404 (file not found due to path validation)
                # or 403 (access denied)
                assert response.status_code in [400, 403, 404], (
                    f"Expected 400, 403 or 404 for {malicious_path}, got {response.status_code}"
                )
        finally:
            app.dependency_overrides.clear()

    def test_get_storage_file_thread_authorization(
        self, test_client, mock_data_layer, temp_storage_dir
    ):
        """Test thread authorization in storage file endpoint."""
        storage_client = mock_data_layer.storage_client

        # Create a file with thread structure
        object_key = "threads/thread123/files/element456.txt"
        storage_client.sync_upload_file(object_key, "thread content", "text/plain")

        # Mock different users
        from unittest.mock import Mock

        authorized_user = Mock()
        authorized_user.id = "user1"
        authorized_user.identifier = "user1"

        unauthorized_user = Mock()
        unauthorized_user.id = "user2"
        unauthorized_user.identifier = "user2"

        # Mock is_thread_author to allow only user1 access to thread123
        async def mock_is_thread_author(user_id, thread_id):
            if user_id == "user1" and thread_id == "thread123":
                return True
            raise HTTPException(status_code=403, detail="Access denied")

        with patch(
            "chainlit.server.is_thread_author", side_effect=mock_is_thread_author
        ):
            # Authorized user should succeed
            def mock_get_authorized_user():
                return authorized_user

            app.dependency_overrides[get_current_user] = mock_get_authorized_user
            try:
                response = test_client.get(
                    "/storage/file/threads/thread123/files/element456.txt"
                )
                assert response.status_code == 200
                assert response.text == "thread content"
            finally:
                app.dependency_overrides.clear()

            # Unauthorized user should be denied
            def mock_get_unauthorized_user():
                return unauthorized_user

            app.dependency_overrides[get_current_user] = mock_get_unauthorized_user
            try:
                response = test_client.get(
                    "/storage/file/threads/thread123/files/element456.txt"
                )
                assert response.status_code == 403
            finally:
                app.dependency_overrides.clear()

    def test_get_storage_file_user_file_authorization(
        self, test_client, mock_data_layer, temp_storage_dir
    ):
        """Test user file authorization for non-thread files."""
        storage_client = mock_data_layer.storage_client

        # Create a file with user structure (sql_alchemy pattern)
        object_key = "user1/element123.txt"
        storage_client.sync_upload_file(object_key, "user file content", "text/plain")

        # Mock users
        from unittest.mock import Mock

        correct_user = Mock()
        correct_user.id = "user1"
        correct_user.identifier = "user1"

        wrong_user = Mock()
        wrong_user.id = "user2"
        wrong_user.identifier = "user2"

        # Correct user should succeed
        def mock_get_correct_user():
            return correct_user

        app.dependency_overrides[get_current_user] = mock_get_correct_user
        try:
            response = test_client.get("/storage/file/user1/element123.txt")
            assert response.status_code == 200
            assert response.text == "user file content"
        finally:
            app.dependency_overrides.clear()

        # Wrong user should be denied
        def mock_get_wrong_user():
            return wrong_user

        app.dependency_overrides[get_current_user] = mock_get_wrong_user
        try:
            response = test_client.get("/storage/file/user1/element123.txt")
            assert response.status_code == 403
            assert (
                "Access denied: file belongs to different user"
                in response.json()["detail"]
            )
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_security_and_edge_cases(self, temp_storage_dir):
        """Test security features and edge cases."""
        client = LocalStorageClient(storage_path=str(temp_storage_dir))

        # Test very long filename (legitimate use case)
        long_name = "a" * 100 + ".txt"  # Reduced from 200 to be more realistic
        result = await client.upload_file(long_name, "content")
        assert result["object_key"] == long_name

        # Test file with no extension
        await client.upload_file("no_extension", "content")
        download_result = await client.download_file("no_extension")
        assert download_result is not None
        _, mime_type = download_result
        assert mime_type == "application/octet-stream"  # Default MIME type

        # Test empty file
        await client.upload_file("empty.txt", "")
        download_result = await client.download_file("empty.txt")
        assert download_result is not None
        content, _ = download_result
        assert content == b""

        # Test that path traversal is blocked in all methods
        traversal_path = "../../../etc/passwd"

        # Upload should fail
        upload_result = await client.upload_file(traversal_path, "malicious")
        assert upload_result == {}

        # Download should fail
        download_result = await client.download_file(traversal_path)
        assert download_result is None

        # Delete should fail
        delete_result = await client.delete_file(traversal_path)
        assert delete_result is False

        # get_read_url should return fallback
        url_result = await client.get_read_url(traversal_path)
        assert url_result == traversal_path
