import os
from unittest.mock import Mock, create_autospec

import pytest
from chainlit.auth import get_current_user
from chainlit.config import APP_ROOT, ChainlitConfig
from chainlit.server import app
from fastapi.testclient import TestClient


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.fixture
def mock_config(monkeypatch: pytest.MonkeyPatch):
    mock_config = Mock(spec=ChainlitConfig)

    monkeypatch.setattr("chainlit.server.config", mock_config)

    return mock_config


@pytest.fixture
def mock_load_translation(mock_config: Mock):
    mock_config.load_translation.return_value = {"key": "value"}

    return mock_config.load_translation


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
    assert response.status_code == 200  # It should still return 200
    assert (
        "translation" in response.json()
    )  # It should fall back to default translation
    mock_load_translation.assert_called_once_with("invalid")


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
    # assert response.headers["content-type"] == favicon_response.
    assert response.content == favicon_response.content
