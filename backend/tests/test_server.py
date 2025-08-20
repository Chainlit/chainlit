import datetime
import os
import pathlib
from pathlib import Path
from typing import Callable
from unittest.mock import AsyncMock, Mock, create_autospec, mock_open

import pytest
from fastapi.testclient import TestClient

from chainlit.auth import get_current_user
from chainlit.config import (
    APP_ROOT,
    ChainlitConfig,
    SpontaneousFileUploadFeature,
)
from chainlit.server import app
from chainlit.types import AskFileSpec
from chainlit.user import PersistedUser


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.fixture
def mock_load_translation(test_config: ChainlitConfig, monkeypatch: pytest.MonkeyPatch):
    mock_method = Mock(return_value={"key": "value"})
    monkeypatch.setattr("chainlit.config.ChainlitConfig.load_translation", mock_method)

    return mock_method


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
        "/project/file/nonexistent?session_id=unauthenticated_session_id"
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


def test_upload_file_disabled(
    test_client: TestClient,
    test_config: ChainlitConfig,
    mock_session_get_by_id_patched: Mock,
    monkeypatch: pytest.MonkeyPatch,
):
    """Test file upload being disabled by config."""

    # Set accept in config
    monkeypatch.setattr(
        test_config.features,
        "spontaneous_file_upload",
        SpontaneousFileUploadFeature(enabled=False),
    )

    # Prepare the files to upload
    file_content = b"Sample file content"
    files = {
        "file": ("test_upload.txt", file_content, "text/plain"),
    }

    # Make the POST request to upload the file
    response = test_client.post(
        "/project/file",
        files=files,
        params={"session_id": mock_session_get_by_id_patched.id},
    )

    # Verify the response
    assert response.status_code == 400


@pytest.mark.parametrize(
    ("accept_pattern", "mime_type", "expected_status"),
    [
        ({"image/*": [".png", ".gif", ".jpeg", ".jpg"]}, "image/jpeg", 400),
        (["image/*"], "text/plain", 400),
        (["image/*", "application/*"], "text/plain", 400),
        (["image/png", "application/pdf"], "image/jpeg", 400),
        (["text/*"], "text/plain", 200),
        (["application/*"], "application/pdf", 200),
        (["image/*"], "image/jpeg", 200),
        (["image/*", "text/*"], "text/plain", 200),
        (["*/*"], "text/plain", 200),
        (["*/*"], "image/jpeg", 200),
        (["*/*"], "application/pdf", 200),
        (["image/*", "application/*"], "application/pdf", 200),
        (["image/*", "application/*"], "image/jpeg", 200),
        (["image/png", "application/pdf"], "image/png", 200),
        (["image/png", "application/pdf"], "application/pdf", 200),
        ({"image/*": []}, "image/jpeg", 200),
        (
            {"image/*": [".png", ".gif", ".jpeg", ".jpg"]},
            "text/plain",
            400,
        ),  # mime type not allowed
        (
            {"*/*": [".txt", ".gif", ".jpeg", ".jpg"]},
            "text/plain",
            200,
        ),  # extension allowed
        (
            {"*/*": [".gif", ".jpeg", ".jpg"]},
            "text/plain",
            400,
        ),  # extension not allowed
    ],
)
def test_upload_file_mime_type_check(
    test_client: TestClient,
    test_config: ChainlitConfig,
    mock_session_get_by_id_patched: Mock,
    monkeypatch: pytest.MonkeyPatch,
    accept_pattern: list[str],
    mime_type: str,
    expected_status: int,
):
    """Test check of mime_type."""

    # Set accept in config
    monkeypatch.setattr(
        test_config.features,
        "spontaneous_file_upload",
        SpontaneousFileUploadFeature(enabled=True, accept=accept_pattern),
    )

    # Prepare the files to upload
    file_content = b"Sample file content"
    files = {
        "file": ("test_upload.txt", file_content, mime_type),
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
    assert response.status_code == expected_status


@pytest.mark.parametrize(
    ("file_content", "content_multiplier", "max_size_mb", "expected_status"),
    [
        (b"1", 1, 1, 200),
        (b"11", 1024 * 1024, 1, 400),
    ],
)
def test_upload_file_size_check(
    test_client: TestClient,
    test_config: ChainlitConfig,
    mock_session_get_by_id_patched: Mock,
    monkeypatch: pytest.MonkeyPatch,
    file_content: bytes,
    content_multiplier: int,
    max_size_mb: int,
    expected_status: int,
):
    """Test check of max_size_mb."""

    file_content = file_content * content_multiplier

    # Set accept in config
    monkeypatch.setattr(
        test_config.features,
        "spontaneous_file_upload",
        SpontaneousFileUploadFeature(max_size_mb=max_size_mb, enabled=True),
    )

    # Prepare the files to upload
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
    assert response.status_code == expected_status


@pytest.mark.parametrize(
    (
        "file_content",
        "content_multiplier",
        "max_size_mb",
        "parent_id",
        "expected_status",
        "accept",
    ),
    [
        (b"1", 1, 1, "mocked_parent_id", 200, ["text/plain"]),
        (b"11", 1024 * 1024, 1, "mocked_parent_id", 400, ["text/plain"]),
        (b"11", 1, 1, "invalid_parent_id", 404, ["text/plain"]),
        (b"11", 1, 1, "mocked_parent_id", 400, ["image/gif"]),
    ],
)
def test_ask_file_with_spontaneous_upload_disabled(
    test_client: TestClient,
    test_config: ChainlitConfig,
    mock_session_get_by_id_patched: Mock,
    monkeypatch: pytest.MonkeyPatch,
    file_content: bytes,
    content_multiplier: int,
    max_size_mb: int,
    parent_id: str,
    expected_status: int,
    accept: list[str],
):
    """Test file upload being disabled by config."""

    # Set accept in config
    monkeypatch.setattr(
        test_config.features,
        "spontaneous_file_upload",
        SpontaneousFileUploadFeature(enabled=False),
    )

    # Prepare the files to upload
    file_content = file_content * content_multiplier
    files = {
        "file": ("test_upload.txt", file_content, "text/plain"),
    }

    expected_file_id = "mocked_file_id"
    mock_session_get_by_id_patched.persist_file = AsyncMock(
        return_value={
            "id": expected_file_id,
            "name": "test_upload.txt",
            "type": "text/plain",
            "size": len(file_content),
        }
    )

    mock_session_get_by_id_patched.files_spec = {
        "mocked_parent_id": AskFileSpec(
            step_id="mocked_file_spec",
            timeout=1,
            type="file",
            accept=accept,
            max_files=1,
            max_size_mb=max_size_mb,
        )
    }

    # Make the POST request to upload the file
    response = test_client.post(
        "/project/file",
        files=files,
        params={
            "session_id": mock_session_get_by_id_patched.id,
            "ask_parent_id": parent_id,
        },
    )

    # Verify the response
    assert response.status_code == expected_status


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


def test_project_settings_with_chat_profile_config_overrides(
    test_client: TestClient,
    test_config: ChainlitConfig,
    monkeypatch: pytest.MonkeyPatch,
):
    """Test that /project/settings endpoint returns merged configuration when chat_profile is specified."""
    from chainlit.config import (
        ChainlitConfigOverrides,
        FeaturesSettings,
        McpFeature,
        UISettings,
    )
    from chainlit.types import ChatProfile

    # Mock chat profiles with different config overrides
    mock_profiles = [
        ChatProfile(
            name="basic",
            markdown_description="Basic profile without overrides",
            default=True,
        ),
        ChatProfile(
            name="mcp-enabled",
            markdown_description="Profile with MCP enabled",
            config_overrides=ChainlitConfigOverrides(
                features=FeaturesSettings(mcp=McpFeature(enabled=True)),
                ui=UISettings(name="MCP Assistant", default_theme="dark"),
            ),
        ),
        ChatProfile(
            name="light-theme",
            markdown_description="Profile with light theme",
            config_overrides=ChainlitConfigOverrides(
                ui=UISettings(
                    name="Light Theme App",
                    default_theme="light",
                    description="Light theme app",
                )
            ),
        ),
    ]

    # Mock the chat profiles callback
    async def mock_get_chat_profiles(user):
        # Use asyncio.sleep to make this truly async
        import asyncio

        await asyncio.sleep(0)
        return mock_profiles

    test_config.code.set_chat_profiles = mock_get_chat_profiles

    # Test 1: Default profile (no overrides)
    response = test_client.get("/project/settings", params={"chat_profile": "basic"})
    assert response.status_code == 200
    config_data = response.json()

    # Should return base configuration without overrides
    assert config_data["ui"]["name"] == test_config.ui.name  # Original name
    assert (
        config_data["features"]["mcp"]["enabled"] == test_config.features.mcp.enabled
    )  # Original MCP setting

    # Test 2: MCP-enabled profile
    response = test_client.get(
        "/project/settings", params={"chat_profile": "mcp-enabled"}
    )
    assert response.status_code == 200
    config_data = response.json()

    # Should return merged configuration with MCP enabled and custom UI
    assert config_data["features"]["mcp"]["enabled"] is True  # Overridden
    assert config_data["ui"]["name"] == "MCP Assistant"  # Overridden
    assert config_data["ui"]["default_theme"] == "dark"  # Overridden

    # Test 3: Light theme profile
    response = test_client.get(
        "/project/settings", params={"chat_profile": "light-theme"}
    )
    assert response.status_code == 200
    config_data = response.json()

    # Should return merged configuration with light theme
    assert config_data["ui"]["default_theme"] == "light"  # Overridden
    assert config_data["ui"]["description"] == "Light theme app"  # Overridden
    assert (
        config_data["features"]["mcp"]["enabled"] == test_config.features.mcp.enabled
    )  # Not overridden

    # Test 4: Non-existent profile (should return base config)
    response = test_client.get(
        "/project/settings", params={"chat_profile": "non-existent"}
    )
    assert response.status_code == 200
    config_data = response.json()

    # Should return base configuration
    assert config_data["ui"]["name"] == test_config.ui.name
    assert config_data["features"]["mcp"]["enabled"] == test_config.features.mcp.enabled

    # Test 5: No profile specified (should return base config)
    response = test_client.get("/project/settings")
    assert response.status_code == 200
    config_data = response.json()

    # Should return base configuration
    assert config_data["ui"]["name"] == test_config.ui.name
    assert config_data["features"]["mcp"]["enabled"] == test_config.features.mcp.enabled


def test_project_settings_config_overrides_serialization(
    test_client: TestClient,
    test_config: ChainlitConfig,
    monkeypatch: pytest.MonkeyPatch,
):
    """Test that config_overrides field is not included in serialized chat profiles."""
    from chainlit.config import ChainlitConfigOverrides, FeaturesSettings, McpFeature
    from chainlit.types import ChatProfile

    # Mock chat profile with config overrides
    mock_profile = ChatProfile(
        name="test-profile",
        markdown_description="Test profile",
        config_overrides=ChainlitConfigOverrides(
            features=FeaturesSettings(mcp=McpFeature(enabled=True))
        ),
    )

    async def mock_get_chat_profiles(user):
        # Use asyncio.sleep to make this truly async
        import asyncio

        await asyncio.sleep(0)
        return [mock_profile]

    test_config.code.set_chat_profiles = mock_get_chat_profiles

    # Get the project settings
    response = test_client.get(
        "/project/settings", params={"chat_profile": "test-profile"}
    )
    assert response.status_code == 200
    config_data = response.json()

    # Check that chatProfiles are included in the response
    assert "chatProfiles" in config_data
    assert len(config_data["chatProfiles"]) == 1

    # Check that config_overrides is NOT included in the serialized profile
    profile_data = config_data["chatProfiles"][0]
    assert "config_overrides" not in profile_data
    assert profile_data["name"] == "test-profile"
    assert profile_data["markdown_description"] == "Test profile"
