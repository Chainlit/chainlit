import os

import httpx
from chainlit.oauth.oauth_provider import OAuthProvider
from chainlit.user import User


class OktaOAuthProvider(OAuthProvider):
    id = "okta"
    env = [
        "OAUTH_OKTA_CLIENT_ID",
        "OAUTH_OKTA_CLIENT_SECRET",
        "OAUTH_OKTA_DOMAIN",
    ]
    # Avoid trailing slash in domain if supplied
    domain = f"https://{os.environ.get('OAUTH_OKTA_DOMAIN', '').rstrip('/')}"

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_OKTA_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_OKTA_CLIENT_SECRET")
        self.authorization_server_id = os.environ.get(
            "OAUTH_OKTA_AUTHORIZATION_SERVER_ID", ""
        )
        self.authorize_url = (
            f"{self.domain}/oauth2{self.get_authorization_server_path()}/v1/authorize"
        )
        self.authorize_params = {
            "response_type": "code",
            "scope": "openid profile email",
            "response_mode": "query",
        }

    def get_authorization_server_path(self):
        if not self.authorization_server_id:
            return "/default"
        if self.authorization_server_id == "false":
            return ""
        return f"/{self.authorization_server_id}"

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
                f"{self.domain}/oauth2{self.get_authorization_server_path()}/v1/token",
                data=payload,
            )
            response.raise_for_status()
            json_data = response.json()

            token = json_data.get("access_token")
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
                f"{self.domain}/oauth2{self.get_authorization_server_path()}/v1/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            okta_user = response.json()

            user = User(
                identifier=okta_user.get("email"),
                metadata={"image": "", "provider": "okta"},
            )
            return (okta_user, user)
