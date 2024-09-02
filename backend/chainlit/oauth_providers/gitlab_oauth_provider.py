import os

import httpx
from chainlit.oauth_providers.oauth_provider import OAuthProvider
from chainlit.user import User
from fastapi import HTTPException


class GitlabOAuthProvider(OAuthProvider):
    id = "gitlab"
    env = [
        "OAUTH_GITLAB_CLIENT_ID",
        "OAUTH_GITLAB_CLIENT_SECRET",
        "OAUTH_GITLAB_DOMAIN",
    ]

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_GITLAB_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_GITLAB_CLIENT_SECRET")
        # Ensure that the domain does not have a trailing slash
        self.domain = f"https://{os.environ.get('OAUTH_GITLAB_DOMAIN', '').rstrip('/')}"

        self.authorize_url = f"{self.domain}/oauth/authorize"

        self.authorize_params = {
            "scope": "openid profile email",
            "response_type": "code",
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
                f"{self.domain}/oauth/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            gitlab_user = response.json()
            user = User(
                identifier=gitlab_user.get("email"),
                metadata={
                    "image": gitlab_user.get("picture", ""),
                    "provider": "gitlab",
                },
            )
            return (gitlab_user, user)
