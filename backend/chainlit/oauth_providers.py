import os
from typing import List, Optional

import httpx
from chainlit.types import AppUser
from fastapi import HTTPException


class OAuthProvider:
    id: str
    env: List[str]
    client_id: str
    client_secret: str
    authorize_url: str
    authorize_params: dict

    def is_configured(self):
        return all([os.environ.get(env) for env in self.env])

    async def get_token(self, code: str) -> str:
        raise NotImplementedError()

    async def get_user_info(self, token: str) -> AppUser:
        raise NotImplementedError()


class GithubOAuthProvider(OAuthProvider):
    id = "github"
    env = ["OAUTH_GITHUB_CLIENT_ID", "OAUTH_GITHUB_CLIENT_SECRET"]
    authorize_url = "https://github.com/login/oauth/authorize"

    def __init__(self):
        self.client_id = os.environ["OAUTH_GITHUB_CLIENT_ID"]
        self.client_secret = os.environ["OAUTH_GITHUB_CLIENT_SECRET"]
        self.authorize_params = {}

    async def get_token(self, code: str):
        async with httpx.AsyncClient() as client:
            payload = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
            }
            result = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"accept": "application/json"},
                data=payload,
            )
            result.raise_for_status()

            token = result.json().get("access_token")
            if not token:
                raise HTTPException(
                    status_code=400, detail="Failed to get the access token"
                )
            return token

    async def get_user_info(self, token: str):
        async with httpx.AsyncClient() as client:
            auth_header = {"Authorization": f"token {token}"}
            user_req_result = await client.get(
                "https://api.github.com/user", headers=auth_header
            )
            user_req_result.raise_for_status()
            user = user_req_result.json()

            app_user = AppUser(
                username=user["login"], image=user["avatar_url"], provider="github"
            )
            return app_user


class GoogleOAuthProvider(OAuthProvider):
    id = "google"
    env = ["OAUTH_GOOGLE_CLIENT_ID", "OAUTH_GOOGLE_CLIENT_SECRET"]
    authorize_url = "https://accounts.google.com/o/oauth2/v2/auth"

    def __init__(self):
        self.client_id = os.environ["OAUTH_GOOGLE_CLIENT_ID"]
        self.client_secret = os.environ["OAUTH_GOOGLE_CLIENT_SECRET"]
        self.authorize_params = {
            "scope": "https://www.googleapis.com/auth/userinfo.profile",
            "response_type": "code",
            "access_type": "offline",
        }

    async def get_token(self, code: str):
        async with httpx.AsyncClient() as client:
            payload = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": "http://127.0.0.1:8000/auth/oauth/google/callback",
            }
            result = await client.post(
                "https://oauth2.googleapis.com/token",
                data=payload,
            )
            result.raise_for_status()

            token = result.json().get("access_token")
            if not token:
                raise HTTPException(
                    status_code=400, detail="Failed to get the access token"
                )
            return token

    async def get_user_info(self, token: str):
        async with httpx.AsyncClient() as client:
            auth_header = {"Authorization": f"Bearer {token}"}
            user_req_result = await client.get(
                "https://www.googleapis.com/userinfo/v2/me", headers=auth_header
            )
            user_req_result.raise_for_status()
            user = user_req_result.json()

            app_user = AppUser(
                username=user["name"], image=user["picture"], provider="google"
            )
            return app_user


providers = [GithubOAuthProvider(), GoogleOAuthProvider()]


def get_oauth_provider(provider: str) -> Optional[OAuthProvider]:
    for p in providers:
        if p.id == provider:
            return p
    return None


def get_configured_oauth_providers():
    return [p.id for p in providers if p.is_configured()]
