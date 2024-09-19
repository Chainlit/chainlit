import os
from pathlib import Path
from unittest.mock import Mock, create_autospec, mock_open

import pytest
from chainlit.auth import get_current_user
from chainlit.config import APP_ROOT, ChainlitConfig, load_config
from chainlit.server import app
from fastapi.testclient import TestClient


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.fixture
def test_config(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    monkeypatch.setenv("CHAINLIT_ROOT_PATH", str(tmp_path))

    config = load_config()

    monkeypatch.setattr("chainlit.server.config", config)

    return config


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
    test_client: TestClient, monkeypatch: pytest.MonkeyPatch, tmp_path
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
