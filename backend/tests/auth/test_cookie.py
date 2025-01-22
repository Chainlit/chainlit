import pytest
from fastapi import FastAPI, Form
from fastapi.testclient import TestClient
from starlette.requests import Request
from starlette.responses import Response

from chainlit.auth import (
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
