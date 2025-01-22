import pytest
from starlette.requests import Request
from starlette.responses import Response

from chainlit.auth import (
    clear_auth_cookie,
    get_token_from_cookies,
    set_auth_cookie,
)


@pytest.mark.asyncio
async def test_set_auth_cookie_4kb():
    """Test that a 4KB token is chunked into the appropriate cookies and reconstructed."""
    # 4000 characters is enough to force at least two chunks since chunk size = 3000
    token_4kb = "x" * 4000

    # Create a Starlette Response and set the cookie
    response = Response()
    set_auth_cookie(response, token_4kb)

    # Extract each Set-Cookie header that was set
    set_cookie_headers = [
        hdr_val.decode("utf-8")
        for hdr_name, hdr_val in response.raw_headers
        if hdr_name.decode("utf-8").lower() == "set-cookie"
    ]

    # We expect 2 chunks:
    #  - chunk_0 = 3000 chars
    #  - chunk_1 = 1000 chars
    assert len(set_cookie_headers) == 2, (
        f"Expected 2 cookies, found {len(set_cookie_headers)}."
    )

    # Simulate reading them back from a request
    cookies = {
        header.split("=")[0]: header.split("=")[1].split(";")[0]
        for header in set_cookie_headers
    }
    reconstructed_token = get_token_from_cookies(cookies)

    assert reconstructed_token == token_4kb, (
        "Reconstructed token does not match the original token!"
    )


@pytest.mark.asyncio
async def test_overwrite_shorter_token_keeps_old_chunk():
    """
    Verify that setting a shorter token after a longer one removes old cookie chunks,
    ensuring no leftover chunks are retained.
    """
    # 1) Set a "long" token that will span multiple chunks.
    long_token = "LONGTOKEN_" + ("x" * 3000)  # ~3000 chars forces at least 2 chunks
    response_long = Response()
    set_auth_cookie(response_long, long_token)

    # Simulate the client storing those cookies
    cookies = {
        hdr_val.decode("utf-8").split("=")[0]: hdr_val.decode("utf-8")
        .split("=")[1]
        .split(";")[0]
        for hdr_name, hdr_val in response_long.raw_headers
        if hdr_name.decode("utf-8").lower() == "set-cookie"
    }

    # Ensure the long token is correctly chunked
    assert len(cookies) == 2, "Expected 2 chunks for the long token."

    # 2) Now set a shorter token on a *new* response object (simulating a new request/response).
    short_token = "SHORTTOKEN"
    response_short = Response()

    # Create a simulated request with the current cookies
    request = Request(scope={"type": "http", "headers": [], "cookies": cookies})

    # Set the shorter token, ensuring old chunks are removed
    set_auth_cookie(response_short, short_token, request=request)

    # Simulate updating the client's cookies with the new response headers
    updated_cookies = {}
    for hdr_name, hdr_val in response_short.raw_headers:
        if hdr_name.decode("utf-8").lower() == "set-cookie":
            key, value = (
                hdr_val.decode("utf-8").split("=")[0],
                hdr_val.decode("utf-8").split("=")[1].split(";")[0],
            )
            updated_cookies[key] = value

    # Check if only 1 chunk remains after overwriting
    assert len(updated_cookies) == 1, (
        f"Expected 1 chunk for the short token, but found {len(updated_cookies)}."
    )

    # Reconstruct the token from the combined cookies
    reconstructed = get_token_from_cookies(updated_cookies)

    # Verify the reconstructed token matches the shorter token only
    assert reconstructed == short_token, (
        "Residual cookie chunks from the previous token were not cleared!"
    )


@pytest.mark.asyncio
async def test_clear_auth_cookie():
    """Test that clearing the authentication cookie removes all chunks."""
    # Set a long token to create multiple chunks
    long_token = "LONGTOKEN_" + ("x" * 3000)
    response_set = Response()
    set_auth_cookie(response_set, long_token)

    # Simulate the client storing those cookies
    cookies = {
        hdr_val.decode("utf-8").split("=")[0]: hdr_val.decode("utf-8")
        .split("=")[1]
        .split(";")[0]
        for hdr_name, hdr_val in response_set.raw_headers
        if hdr_name.decode("utf-8").lower() == "set-cookie"
    }

    # Clear the authentication cookies
    request = Request(scope={"type": "http", "headers": [], "cookies": cookies})
    response_clear = Response()
    clear_auth_cookie(request, response_clear)

    # Extract the Set-Cookie headers to verify cookies are cleared
    clear_cookie_headers = [
        hdr_val.decode("utf-8")
        for hdr_name, hdr_val in response_clear.raw_headers
        if hdr_name.decode("utf-8").lower() == "set-cookie"
    ]

    assert all("Max-Age=0" in header for header in clear_cookie_headers), (
        "Not all cookies were cleared!"
    )
