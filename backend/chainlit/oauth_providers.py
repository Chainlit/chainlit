import os
import urllib.parse
from typing import Dict, List, Optional, Tuple

import aiohttp
from chainlit.types import AppUser
from fastapi import HTTPException


class OAuthProvider:
    id: str
    env: List[str]
    client_id: str
    client_secret: str
    authorize_url: str
    authorize_params: Dict[str, str]

    def is_configured(self):
        return all([os.environ.get(env) for env in self.env])

    async def get_token(self, code: str, url: str) -> str:
        raise NotImplementedError()

    async def get_user_info(self, token: str) -> Tuple[Dict[str, str], AppUser]:
        raise NotImplementedError()


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
        async with aiohttp.ClientSession(raise_for_status=True) as session:
            async with session.post(
                "https://github.com/login/oauth/access_token",
                json=payload,
            ) as result:
                text = await result.text()
                content = urllib.parse.parse_qs(text)
                token = content.get("access_token", [""])[0]
                if not token:
                    raise HTTPException(
                        status_code=400, detail="Failed to get the access token"
                    )
                return token

    async def get_user_info(self, token: str):
        async with aiohttp.ClientSession(raise_for_status=True) as session:
            async with session.get(
                "https://api.github.com/user",
                headers={"Authorization": f"token {token}"},
            ) as result:
                user = await result.json()

                async with session.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"token {token}"},
                ) as email_result:
                    emails = await email_result.json()

                    user.update({"emails": emails})

                    app_user = AppUser(
                        username=user["login"],
                        image=user["avatar_url"],
                        provider="github",
                    )
                    return (user, app_user)


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
        async with aiohttp.ClientSession(raise_for_status=True) as session:
            async with session.post(
                "https://oauth2.googleapis.com/token",
                data=payload,
            ) as result:
                json = await result.json()
                token = json["access_token"]
                if not token:
                    raise HTTPException(
                        status_code=400, detail="Failed to get the access token"
                    )
                return token

    async def get_user_info(self, token: str):
        async with aiohttp.ClientSession(raise_for_status=True) as session:
            async with session.get(
                "https://www.googleapis.com/userinfo/v2/me",
                headers={"Authorization": f"Bearer {token}"},
            ) as result:
                user = await result.json()

                app_user = AppUser(
                    username=user["name"], image=user["picture"], provider="google"
                )
                return (user, app_user)


class AzureADOAuthProvider(OAuthProvider):
    id = "azure-ad"
    env = [
        "OAUTH_AZURE_AD_CLIENT_ID",
        "OAUTH_AZURE_AD_CLIENT_SECRET",
        "OAUTH_AZURE_AD_TENANT_ID",
    ]
    authorize_url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_AZURE_AD_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_AZURE_AD_CLIENT_SECRET")
        self.authorize_params = {
            "tenant": os.environ.get("OAUTH_AZURE_AD_TENANT_ID"),
            "response_type": "code",
            "scope": "https://graph.microsoft.com/User.Read",
            "response_mode": "query",
        }

    async def get_token(self, code: str, url: str):
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": url,
        }
        async with aiohttp.ClientSession(raise_for_status=True) as session:
            async with session.post(
                "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                data=payload,
            ) as result:
                json = await result.json()

                token = json["access_token"]
                if not token:
                    raise HTTPException(
                        status_code=400, detail="Failed to get the access token"
                    )
                return token

    async def get_user_info(self, token: str):
        async with aiohttp.ClientSession(raise_for_status=True) as session:
            async with session.get(
                "https://graph.microsoft.com/v1.0/users/me",
                headers={"Authorization": f"Bearer {token}"},
            ) as result:
                user = await result.json()

                app_user = AppUser(
                    username=user["userPrincipalName"], image="", provider="azure-ad"
                )
                return (user, app_user)


providers = [GithubOAuthProvider(), GoogleOAuthProvider(), AzureADOAuthProvider()]


def get_oauth_provider(provider: str) -> Optional[OAuthProvider]:
    for p in providers:
        if p.id == provider:
            return p
    return None


def get_configured_oauth_providers():
    return [p.id for p in providers if p.is_configured()]
