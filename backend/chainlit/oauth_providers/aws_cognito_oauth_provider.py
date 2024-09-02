import os

import httpx
from chainlit.oauth_providers.oauth_provider import OAuthProvider
from chainlit.user import User
from fastapi import HTTPException


class AWSCognitoOAuthProvider(OAuthProvider):
    id = "aws-cognito"
    env = [
        "OAUTH_COGNITO_CLIENT_ID",
        "OAUTH_COGNITO_CLIENT_SECRET",
        "OAUTH_COGNITO_DOMAIN",
    ]
    authorize_url = f"https://{os.environ.get('OAUTH_COGNITO_DOMAIN')}/login"
    token_url = f"https://{os.environ.get('OAUTH_COGNITO_DOMAIN')}/oauth2/token"

    def __init__(self):
        self.client_id = os.environ.get("OAUTH_COGNITO_CLIENT_ID")
        self.client_secret = os.environ.get("OAUTH_COGNITO_CLIENT_SECRET")
        self.authorize_params = {
            "response_type": "code",
            "client_id": self.client_id,
            "scope": "openid profile email",
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
                self.token_url,
                data=payload,
            )
            response.raise_for_status()
            json = response.json()

            token = json.get("access_token")
            if not token:
                raise HTTPException(
                    status_code=400, detail="Failed to get the access token"
                )
            return token

    async def get_user_info(self, token: str):
        user_info_url = (
            f"https://{os.environ.get('OAUTH_COGNITO_DOMAIN')}/oauth2/userInfo"
        )
        async with httpx.AsyncClient() as client:
            response = await client.get(
                user_info_url,
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()

            cognito_user = response.json()

            # Customize user metadata as needed
            user = User(
                identifier=cognito_user["email"],
                metadata={
                    "image": cognito_user.get("picture", ""),
                    "provider": "aws-cognito",
                },
            )
            return (cognito_user, user)
