import os

import httpx
from chainlit.oauth_providers.oauth_provider import OAuthProvider
from chainlit.user import User


class DescopeOAuthProvider(OAuthProvider):
    id = "descope"
    env = ["OAUTH_DESCOPE_CLIENT_ID", "OAUTH_DESCOPE_CLIENT_SECRET"]
    # Ensure that the domain does not have a trailing slash
    domain = f"https://api.descope.com/oauth2/v1"

    authorize_url = f"{domain}/authorize"

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_DESCOPE_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_DESCOPE_CLIENT_SECRET")
        self.authorize_params = {
            "response_type": "code",
            "scope": "openid profile email",
            "audience": f"{self.domain}/userinfo",
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
                f"{self.domain}/token",
                data=payload,
            )
            response.raise_for_status()
            json_content = response.json()
            token = json_content.get("access_token")
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
                f"{self.domain}/userinfo", headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()  # This will raise an exception for 4xx/5xx responses
            descope_user = response.json()

            user = User(
                identifier=descope_user.get("email"),
                metadata={"image": "", "provider": "descope"},
            )
            return (descope_user, user)
