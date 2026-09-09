import importlib

import pytest
from fastapi import Depends, FastAPI, Form
from fastapi.testclient import TestClient
from starlette.requests import Request
from starlette.responses import Response

import chainlit.auth.cookie as cookie_module
from chainlit.auth import (
    OAuth2PasswordBearerWithCookie,
    clear_auth_cookie,
    get_token_from_cookies,
    set_auth_cookie,
)


@pytest.fixture
def test_app():
    app = FastAPI()

    @app.post("/set-cookie")
    async def set_cookie_endpoint(request: Request, token: str = Form()):
        response = Response()
        set_auth_cookie(request, response, token)
        return response

    @app.get("/get-token")
    async def get_token_endpoint(request: Request):
        token = get_token_from_cookies(request.cookies)
        return {"token": token}

    @app.delete("/clear-cookie")
    async def clear_cookie_endpoint(request: Request):
        response = Response()
        clear_auth_cookie(request, response)
        return response

    return app


@pytest.fixture
def client(test_app):
    return TestClient(test_app)


def test_short_token(client):
    """Test with a <3000 shorter token."""

    # Set a short token
    short_token = "x" * 1000
    set_response = client.post("/set-cookie", data={"token": short_token})
    assert set_response.status_code == 200

    # Verify cookies were set
    cookies = set_response.cookies
    assert cookies, "No cookies set"
    assert "access_token" in cookies, f"No chunking for short cookies: {cookies}"

    # Read back the token using client's cookie jar
    get_response = client.get("/get-token")
    assert get_response.status_code == 200
    assert get_response.json()["token"] == short_token


def test_set_and_read_4kb_token(client):
    """Test full cookie lifecycle using actual client cookie handling."""

    # Set a 4KB token
    token_4kb = "x" * 4000
    set_response = client.post("/set-cookie", data={"token": token_4kb})
    assert set_response.status_code == 200

    # Verify cookies were set
    cookies = set_response.cookies
    assert f"{cookies.keys()} should contain chunked cookies", any(
        key.startswith("access_token_") for key in cookies.keys()
    )

    # Read back the token using client's cookie jar
    get_response = client.get("/get-token")
    assert get_response.status_code == 200

    response_token = get_response.json()["token"]
    assert len(response_token) == len(token_4kb)
    assert response_token == token_4kb


def test_overwrite_shorter_token_chunked(client):
    """Test cookie chunk cleanup when replacing a large token with a smaller one."""
    # Set initial long token
    long_token = "LONG" * 2000  # 8000 characters
    client.post("/set-cookie", data={"token": long_token})

    # Verify initial chunks exist
    first_cookies = client.cookies
    assert len([k for k in first_cookies if k.startswith("access_token_")]) > 1

    # Set shorter token (should clear previous chunks)
    short_token = "SHORT" * 1000  # 4000 characters
    client.post("/set-cookie", data={"token": short_token})

    # Verify new cookie state
    final_response = client.get("/get-token")
    assert final_response.json()["token"] == short_token

    # Verify only two chunks remain
    final_cookies = client.cookies
    chunk_cookies = [k for k in final_cookies if k.startswith("access_token_")]
    assert len(chunk_cookies) == 2, f"Found {len(chunk_cookies)} residual cookies"


def test_overwrite_shorter_token_unchunked(client):
    """Test cookie chunk cleanup when replacing a large token with a smaller one."""
    # Set initial long token
    long_token = "LONG" * 1000  # 4000 characters
    client.post("/set-cookie", data={"token": long_token})

    # Verify initial chunks exist
    first_cookies = client.cookies
    assert len([k for k in first_cookies if k.startswith("access_token_")]) > 1

    # Set shorter token (should clear previous chunks)
    short_token = "SHORT"
    client.post("/set-cookie", data={"token": short_token})

    # Verify new cookie state
    final_response = client.get("/get-token")
    assert final_response.json()["token"] == short_token

    # Verify no chunks remain
    final_cookies = client.cookies
    chunk_cookies = [k for k in final_cookies if k.startswith("access_token_")]
    assert len(chunk_cookies) == 0, f"Found {len(chunk_cookies)} residual cookies"


def test_cookie_path_uses_chainlit_root_path_value(monkeypatch):
    """CHAINLIT_ROOT_PATH must be used as the cookie path directly.

    Before the fix, the code read::

        _cookie_path = os.environ.get(_cookie_root_path, "/")

    where ``_cookie_root_path`` was the *value* of ``CHAINLIT_ROOT_PATH``,
    not a key.  This caused ``_cookie_path`` to always be ``"/"`` (the
    default) whenever ``CHAINLIT_ROOT_PATH`` was set, because the value
    (e.g. ``"/app"``) is not a valid environment variable name.  Cookie
    deletion then used the wrong path, leaving stale cookies on the client.
    """
    monkeypatch.setenv("CHAINLIT_ROOT_PATH", "/myapp")
    monkeypatch.delenv("CHAINLIT_AUTH_COOKIE_PATH", raising=False)
    try:
        importlib.reload(cookie_module)
        assert cookie_module._cookie_path == "/myapp", (
            f"Expected _cookie_path to be '/myapp' but got '{cookie_module._cookie_path}'. "
            "CHAINLIT_ROOT_PATH value should be used directly as the cookie path."
        )
    finally:
        # Reload with the patched env removed so module state is restored and
        # this test does not leak _cookie_path="/myapp" into other tests.
        monkeypatch.undo()
        importlib.reload(cookie_module)


def test_validate_oauth_state_cookie_rejects_missing_state(monkeypatch):
    """validate_oauth_state_cookie must raise when the state cookie is absent."""
    from starlette.requests import Request as StarletteRequest

    from chainlit.auth.cookie import validate_oauth_state_cookie

    scope = {
        "type": "http",
        "headers": [],
        "query_string": b"",
        "method": "GET",
        "path": "/",
    }
    request = StarletteRequest(scope)
    # Cookies dict is empty — oauth_state cookie is absent
    with pytest.raises(Exception, match="oauth state does not correspond"):
        validate_oauth_state_cookie(request, "expected_state")


def test_validate_oauth_state_cookie_accepts_correct_state():
    """validate_oauth_state_cookie must not raise when states match."""
    from starlette.requests import Request as StarletteRequest

    from chainlit.auth.cookie import validate_oauth_state_cookie

    state_value = "secret_state_token"

    # Build a minimal request with the oauth_state cookie set
    scope = {
        "type": "http",
        "headers": [
            (b"cookie", f"oauth_state={state_value}".encode()),
        ],
        "query_string": b"",
        "method": "GET",
        "path": "/",
    }
    request = StarletteRequest(scope)
    # Should not raise
    validate_oauth_state_cookie(request, state_value)


def test_state_cookie_lifetime_default(monkeypatch):
    """Test that _state_cookie_lifetime defaults to 180 seconds (3 minutes)."""
    monkeypatch.delenv("CHAINLIT_STATE_COOKIE_LIFETIME", raising=False)
    importlib.reload(cookie_module)
    assert cookie_module._state_cookie_lifetime == 180


def test_state_cookie_lifetime_custom(monkeypatch):
    """Test that _state_cookie_lifetime can be set via environment variable."""
    monkeypatch.setenv("CHAINLIT_STATE_COOKIE_LIFETIME", "600")
    importlib.reload(cookie_module)
    assert cookie_module._state_cookie_lifetime == 600


def test_clear_auth_cookie(client):
    """Test cookie clearing removes all chunks."""
    # Set initial token
    client.post("/set-cookie", data={"token": "x" * 4000})

    # Verify cookies exist
    assert len(client.cookies) > 0

    # Clear cookies
    clear_response = client.delete("/clear-cookie")
    assert clear_response.status_code == 200

    # Verify cookies were cleared
    assert len(clear_response.cookies) == 0
    final_response = client.get("/get-token")
    assert final_response.json()["token"] is None


def test_cookie_oauth_generates_openapi_security_scheme():
    auth_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/login", auto_error=False)
    app = FastAPI()

    @app.get("/protected")
    async def protected(token: str = Depends(auth_scheme)):
        return {"token": token}

    schema = app.openapi()
    security_scheme = schema["components"]["securitySchemes"][
        "OAuth2PasswordBearerWithCookie"
    ]

    assert security_scheme == {
        "type": "oauth2",
        "flows": {"password": {"scopes": {}, "tokenUrl": "/login"}},
    }
