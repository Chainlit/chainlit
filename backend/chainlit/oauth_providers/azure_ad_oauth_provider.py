import base64
import os

import httpx
from chainlit.oauth_providers.oauth_provider import OAuthProvider
from chainlit.user import User
from fastapi import HTTPException


class AzureADOAuthProvider(OAuthProvider):
    id = "azure-ad"
    env = [
        "OAUTH_AZURE_AD_CLIENT_ID",
        "OAUTH_AZURE_AD_CLIENT_SECRET",
        "OAUTH_AZURE_AD_TENANT_ID",
    ]
    authorize_url = (
        f"https://login.microsoftonline.com/{os.environ.get('OAUTH_AZURE_AD_TENANT_ID', '')}/oauth2/v2.0/authorize"
        if os.environ.get("OAUTH_AZURE_AD_ENABLE_SINGLE_TENANT")
        else "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    )
    token_url = (
        f"https://login.microsoftonline.com/{os.environ.get('OAUTH_AZURE_AD_TENANT_ID', '')}/oauth2/v2.0/token"
        if os.environ.get("OAUTH_AZURE_AD_ENABLE_SINGLE_TENANT")
        else "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    )

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
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data=payload,
            )
            response.raise_for_status()
            json = response.json()

            token = json["access_token"]
            if not token:
                raise HTTPException(
                    status_code=400, detail="Failed to get the access token"
                )
            return token

    async def get_user_info(self, token: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()

            azure_user = response.json()

            try:
                photo_response = await client.get(
                    "https://graph.microsoft.com/v1.0/me/photos/48x48/$value",
                    headers={"Authorization": f"Bearer {token}"},
                )
                photo_data = await photo_response.aread()
                base64_image = base64.b64encode(photo_data)
                azure_user["image"] = (
                    f"data:{photo_response.headers['Content-Type']};base64,{base64_image.decode('utf-8')}"
                )
            except Exception as e:
                # Ignore errors getting the photo
                pass

            user = User(
                identifier=azure_user["userPrincipalName"],
                metadata={"image": azure_user.get("image"), "provider": "azure-ad"},
            )
            return (azure_user, user)
