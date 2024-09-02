import os
import urllib.parse

import httpx
from chainlit.oauth_providers.oauth_provider import OAuthProvider
from chainlit.user import User
from fastapi import HTTPException


class GithubOAuthProvider(OAuthProvider):
    id = "github"
    env = ["OAUTH_GITHUB_CLIENT_ID", "OAUTH_GITHUB_CLIENT_SECRET"]
    authorize_url = "https://github.com/login/oauth/authorize"

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_GITHUB_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_GITHUB_CLIENT_SECRET")
        self.authorize_params = {
            "scope": "user:email",
        }

    async def get_token(self, code: str, url: str):
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data=payload,
            )
            response.raise_for_status()
            content = urllib.parse.parse_qs(response.text)
            token = content.get("access_token", [""])[0]
            if not token:
                raise HTTPException(
                    status_code=400, detail="Failed to get the access token"
                )
            return token

    async def get_user_info(self, token: str):
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"token {token}"},
            )
            user_response.raise_for_status()
            github_user = user_response.json()

            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {token}"},
            )
            emails_response.raise_for_status()
            emails = emails_response.json()

            github_user.update({"emails": emails})
            user = User(
                identifier=github_user["login"],
                metadata={"image": github_user["avatar_url"], "provider": "github"},
            )
            return (github_user, user)
