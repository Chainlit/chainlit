import os

import httpx
from chainlit.oauth.oauth_provider import OAuthProvider
from chainlit.user import User
from fastapi import HTTPException


class Auth0OAuthProvider(OAuthProvider):
    id = "auth0"
    env = ["OAUTH_AUTH0_CLIENT_ID", "OAUTH_AUTH0_CLIENT_SECRET", "OAUTH_AUTH0_DOMAIN"]

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_AUTH0_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_AUTH0_CLIENT_SECRET")
        # Ensure that the domain does not have a trailing slash
        self.domain = f"https://{os.environ.get('OAUTH_AUTH0_DOMAIN', '').rstrip('/')}"
        self.original_domain = (
            f"https://{os.environ.get('OAUTH_AUTH0_ORIGINAL_DOMAIN').rstrip('/')}"
            if os.environ.get("OAUTH_AUTH0_ORIGINAL_DOMAIN")
            else self.domain
        )

        self.authorize_url = f"{self.domain}/authorize"

        self.authorize_params = {
            "response_type": "code",
            "scope": "openid profile email",
            "audience": f"{self.original_domain}/userinfo",
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
                f"{self.domain}/oauth/token",
                data=payload,
            )
            response.raise_for_status()
            json_content = response.json()
            token = json_content.get("access_token")
            if not token:
                raise HTTPException(
                    status_code=400, detail="Failed to get the access token"
                )
            return token

    async def get_user_info(self, token: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.original_domain}/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            auth0_user = response.json()
            user = User(
                identifier=auth0_user.get("email"),
                metadata={
                    "image": auth0_user.get("picture", ""),
                    "provider": "auth0",
                },
            )
            return (auth0_user, user)
