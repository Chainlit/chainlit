import os

import httpx
from chainlit.oauth.oauth_provider import OAuthProvider
from chainlit.user import User


class GoogleOAuthProvider(OAuthProvider):
    id = "google"
    env = ["OAUTH_GOOGLE_CLIENT_ID", "OAUTH_GOOGLE_CLIENT_SECRET"]
    authorize_url = "https://accounts.google.com/o/oauth2/v2/auth"

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_GOOGLE_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_GOOGLE_CLIENT_SECRET")
        self.authorize_params = {
            "scope": "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
            "response_type": "code",
            "access_type": "offline",
        }

    async def get_token(self, code: str, url: str):
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": url,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=payload,
            )
            response.raise_for_status()
            json = response.json()
            token = json.get("access_token")
            if not token:
                raise httpx.HTTPStatusError(
                    "Failed to get the access token",
                    request=response.request,
                    response=response,
                )
            return token

    async def get_user_info(self, token: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/userinfo/v2/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            google_user = response.json()
            user = User(
                identifier=google_user["email"],
                metadata={"image": google_user["picture"], "provider": "google"},
            )
            return (google_user, user)
