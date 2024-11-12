import datetime  # Added import for datetime
import os
import pathlib
import tempfile
from pathlib import Path
from typing import Callable
from unittest.mock import AsyncMock, Mock, create_autospec, mock_open

import pytest
from fastapi.testclient import TestClient

from chainlit.auth import get_current_user
from chainlit.config import APP_ROOT, ChainlitConfig, load_config
from chainlit.server import app
from chainlit.session import WebsocketSession
from chainlit.types import FileReference
from chainlit.user import PersistedUser  # Added import for PersistedUser


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.fixture
def mock_load_translation(test_config: ChainlitConfig, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        test_config, "load_translation", Mock(return_value={"key": "value"})
    )

    return test_config.load_translation


def test_project_translations_default_language(
    test_client: TestClient, mock_load_translation: Mock
):
    """Test with default language."""
    response = test_client.get("/project/translations")
    assert response.status_code == 200
    assert "translation" in response.json()
    mock_load_translation.assert_called_once_with("en-US")
    mock_load_translation.reset_mock()


def test_project_translations_specific_language(
    test_client: TestClient, mock_load_translation: Mock
):
    """Test with a specific language."""

    response = test_client.get("/project/translations?language=fr-FR")
    assert response.status_code == 200
    assert "translation" in response.json()
    mock_load_translation.assert_called_once_with("fr-FR")
    mock_load_translation.reset_mock()


def test_project_translations_invalid_language(
    test_client: TestClient, mock_load_translation: Mock
):
    """Test with an invalid language."""

    response = test_client.get("/project/translations?language=invalid")
    assert response.status_code == 422

    assert (
        "translation" not in response.json()
    )  # It should fall back to default translation
    assert not mock_load_translation.called


def test_project_translations_bcp47_language(
    test_client: TestClient, mock_load_translation: Mock
):
    """Regression test for https://github.com/Chainlit/chainlit/issues/1352."""

    response = test_client.get("/project/translations?language=es-419")
    assert response.status_code == 200
    assert "translation" in response.json()
    mock_load_translation.assert_called_once_with("es-419")
    mock_load_translation.reset_mock()


@pytest.fixture
def mock_get_current_user():
    """Override get_current_user() dependency."""

    # Programming sucks!
    # Ref: https://github.com/fastapi/fastapi/issues/3331#issuecomment-1182452859
    app.dependency_overrides[get_current_user] = create_autospec(lambda: None)

    yield app.dependency_overrides[get_current_user]

    del app.dependency_overrides[get_current_user]


async def test_project_settings(test_client: TestClient, mock_get_current_user: Mock):
    """Burn test for project settings."""
    response = test_client.get(
        "/project/settings",
    )

    mock_get_current_user.assert_called_once()

    assert response.status_code == 200, response.json()
    data = response.json()

    assert "ui" in data
    assert "features" in data
    assert "userEnv" in data
    assert "dataPersistence" in data
    assert "threadResumable" in data
    assert "markdown" in data
    assert "debugUrl" in data
    assert data["chatProfiles"] == []
    assert data["starters"] == []


def test_project_settings_path_traversal(
    test_client: TestClient,
    mock_get_current_user: Mock,
    tmp_path: Path,
    test_config: ChainlitConfig,
):
    """Test to prevent path traversal in project settings."""

    # Create a mock chainlit directory structure
    app_dir = tmp_path / "app"
    app_dir.mkdir()
    (tmp_path / "README.md").write_text("This is a secret README")

    # This is required for the exploit to occur.
    chainlit_dir = app_dir / "chainlit_stuff"
    chainlit_dir.mkdir()

    # Mock the config root
    test_config.root = str(app_dir)

    # Attempt to access the file using path traversal
    response = test_client.get(
        "/project/settings", params={"language": "stuff/../../README"}
    )

    # Should not be able to read the file
    assert "This is a secret README" not in response.text

    assert response.status_code == 422

    # The response should not contain the normally expected keys
    data = response.json()
    assert "ui" not in data
    assert "features" not in data
    assert "userEnv" not in data
    assert "dataPersistence" not in data
    assert "threadResumable" not in data
    assert "markdown" not in data
    assert "chatProfiles" not in data
    assert "starters" not in data
    assert "debugUrl" not in data


def test_get_avatar_default(test_client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """Test with default avatar."""
    response = test_client.get("/avatars/default")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/")


def test_get_avatar_custom(test_client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """Test with custom avatar."""
    custom_avatar_path = os.path.join(
        APP_ROOT, "public", "avatars", "custom_avatar.png"
    )
    os.makedirs(os.path.dirname(custom_avatar_path), exist_ok=True)
    with open(custom_avatar_path, "wb") as f:
        f.write(b"fake image data")

    response = test_client.get("/avatars/custom_avatar")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/")
    assert response.content == b"fake image data"

    # Clean up
    os.remove(custom_avatar_path)


def test_get_avatar_with_spaces(
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    """Test with custom avatar."""
    custom_avatar_path = os.path.join(APP_ROOT, "public", "avatars", "my_assistant.png")
    os.makedirs(os.path.dirname(custom_avatar_path), exist_ok=True)
    with open(custom_avatar_path, "wb") as f:
        f.write(b"fake image data")

    response = test_client.get("/avatars/My Assistant")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/")
    assert response.content == b"fake image data"

    # Clean up
    os.remove(custom_avatar_path)


def test_get_avatar_non_existent_favicon(
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    """Test with non-existent avatar (should return favicon)."""
    favicon_response = test_client.get("/favicon")
    assert favicon_response.status_code == 200

    response = test_client.get("/avatars/non_existent")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/")
    assert response.content == favicon_response.content


def test_avatar_path_traversal(
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch, tmp_path: pathlib.Path
):
    """Test to prevent potential path traversal in avatar route on Windows."""

    # Create a Mock object for the glob function
    mock_glob = Mock(return_value=[])
    monkeypatch.setattr("chainlit.server.glob.glob", mock_glob)

    mock_open_inst = mock_open(read_data=b'{"should_not": "Be readable."}')
    monkeypatch.setattr("builtins.open", mock_open_inst)

    # Attempt to access a file using path traversal
    response = test_client.get("/avatars/..%5C..%5Capp")

    # No glob should ever be called
    assert not mock_glob.called

    # Should return an error status
    assert response.status_code == 400


@pytest.fixture
def mock_session_get_by_id_patched(mock_session: Mock, monkeypatch: pytest.MonkeyPatch):
    test_session_id = "test_session_id"

    # Mock the WebsocketSession.get_by_id method to return the mock session
    monkeypatch.setattr(
        "chainlit.session.WebsocketSession.get_by_id",
        lambda session_id: mock_session if session_id == test_session_id else None,
    )

    return mock_session


def test_get_file_success(
    test_client: TestClient,
    mock_session_get_by_id_patched: Mock,
    tmp_path: pathlib.Path,
    mock_get_current_user: Mock,
):
    """
    Test successful retrieval of a file from a session.
    """
    # Set current_user to match session.user
    mock_get_current_user.return_value = mock_session_get_by_id_patched.user

    # Create test data
    test_content = b"Test file content"
    test_file_id = "test_file_id"

    # Create a temporary file with the test content
    test_file = tmp_path / "test_file"
    test_file.write_bytes(test_content)

    mock_session_get_by_id_patched.files = {
        test_file_id: {
            "id": test_file_id,
            "path": test_file,
            "name": "test.txt",
            "type": "text/plain",
            "size": len(test_content),
        }
    }

    # Make the GET request to retrieve the file
    response = test_client.get(
        f"/project/file/{test_file_id}?session_id={mock_session_get_by_id_patched.id}"
    )

    # Verify the response
    assert response.status_code == 200
    assert response.content == test_content
    assert response.headers["content-type"].startswith("text/plain")


def test_get_file_not_existent_file(
    test_client: TestClient,
    mock_session_get_by_id_patched: Mock,
    mock_get_current_user: Mock,
):
    """
    Test retrieval of a non-existing file from a session.
    """
    # Set current_user to match session.user
    mock_get_current_user.return_value = mock_session_get_by_id_patched.user

    # Make the GET request to retrieve the file
    response = test_client.get("/project/file/test_file_id?session_id=test_session_id")

    # Verify the response
    assert response.status_code == 404


def test_get_file_non_existing_session(
    test_client: TestClient,
    tmp_path: pathlib.Path,
    mock_session_get_by_id_patched: Mock,
    mock_session: Mock,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    Test that an unauthenticated user cannot retrieve a file uploaded by an authenticated user.
    """

    # Attempt to access the file without authentication by providing an invalid session_id
    response = test_client.get(
        f"/project/file/nonexistent?session_id=unauthenticated_session_id"
    )

    # Verify the response
    assert response.status_code == 401  # Unauthorized


def test_upload_file_success(
    test_client: TestClient,
    test_config: ChainlitConfig,
    mock_session_get_by_id_patched: Mock,
):
    """Test successful file upload."""

    # Prepare the files to upload
    file_content = b"Sample file content"
    files = {
        "file": ("test_upload.txt", file_content, "text/plain"),
    }

    # Mock the persist_file method to return a known value
    expected_file_id = "mocked_file_id"
    mock_session_get_by_id_patched.persist_file = AsyncMock(
        return_value={
            "id": expected_file_id,
            "name": "test_upload.txt",
            "type": "text/plain",
            "size": len(file_content),
        }
    )

    # Make the POST request to upload the file
    response = test_client.post(
        "/project/file",
        files=files,
        params={"session_id": mock_session_get_by_id_patched.id},
    )

    # Verify the response
    assert response.status_code == 200
    response_data = response.json()
    assert "id" in response_data
    assert response_data["id"] == expected_file_id
    assert response_data["name"] == "test_upload.txt"
    assert response_data["type"] == "text/plain"
    assert response_data["size"] == len(file_content)

    # Verify that persist_file was called with the correct arguments
    mock_session_get_by_id_patched.persist_file.assert_called_once_with(
        name="test_upload.txt", content=file_content, mime="text/plain"
    )


def test_file_access_by_different_user(
    test_client: TestClient,
    mock_session_get_by_id_patched: Mock,
    persisted_test_user: PersistedUser,
    tmp_path: pathlib.Path,
    mock_session_factory: Callable[..., Mock],
):
    """Test that a file uploaded by one user cannot be accessed by another user."""

    # Prepare the files to upload
    file_content = b"Sample file content"
    files = {
        "file": ("test_upload.txt", file_content, "text/plain"),
    }

    # Mock the persist_file method to return a known value
    expected_file_id = "mocked_file_id"
    mock_session_get_by_id_patched.persist_file = AsyncMock(
        return_value={
            "id": expected_file_id,
            "name": "test_upload.txt",
            "type": "text/plain",
            "size": len(file_content),
        }
    )

    # Make the POST request to upload the file
    response = test_client.post(
        "/project/file",
        files=files,
        params={"session_id": mock_session_get_by_id_patched.id},
    )

    # Verify the response
    assert response.status_code == 200

    response_data = response.json()
    assert "id" in response_data
    file_id = response_data["id"]

    # Create a second session with a different user
    second_session = mock_session_factory(
        id="another_session_id",
        user=PersistedUser(
            id="another_user_id",
            createdAt=datetime.datetime.now().isoformat(),
            identifier="another_user_identifier",
        ),
    )

    # Attempt to access the uploaded file using the second user's session
    response = test_client.get(
        f"/project/file/{file_id}?session_id={second_session.id}"
    )

    # Verify that the access attempt fails
    assert response.status_code == 401  # Unauthorized


def test_upload_file_missing_file(
    test_client: TestClient,
    mock_session: Mock,
):
    """Test file upload with missing file in the request."""

    # Make the POST request without a file
    response = test_client.post(
        "/project/file",
        data={"session_id": mock_session.id},
    )

    # Verify the response
    assert response.status_code == 422  # Unprocessable Entity
    assert "detail" in response.json()


def test_upload_file_invalid_session(
    test_client: TestClient,
):
    """Test file upload with an invalid session."""

    # Prepare the files to upload
    file_content = b"Sample file content"
    files = {
        "file": ("test_upload.txt", file_content, "text/plain"),
    }

    # Make the POST request with an invalid session_id
    response = test_client.post(
        "/project/file",
        files=files,
        data={"session_id": "invalid_session_id"},
    )

    # Verify the response
    assert response.status_code == 422


def test_upload_file_unauthorized(
    test_client: TestClient,
    test_config: ChainlitConfig,
    mock_session_get_by_id_patched: Mock,
):
    """Test file upload without proper authorization."""

    # Mock the upload_file_session to have no user
    mock_session_get_by_id_patched.user = None

    # Prepare the files to upload
    file_content = b"Sample file content"
    files = {
        "file": ("test_upload.txt", file_content, "text/plain"),
    }

    # Make the POST request to upload the file
    response = test_client.post(
        "/project/file",
        files=files,
        data={"session_id": mock_session_get_by_id_patched.id},
    )

    assert response.status_code == 422


def test_project_translations_file_path_traversal(
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    """Test to prevent file path traversal in project translations."""

    mock_open_inst = mock_open(read_data='{"should_not": "Be readable."}')
    monkeypatch.setattr("builtins.open", mock_open_inst)

    # Attempt to access the file using path traversal
    response = test_client.get(
        "/project/translations", params={"language": "/app/unreadable"}
    )

    # File should never be opened
    assert not mock_open_inst.called

    # Should give error status
    assert response.status_code == 422
