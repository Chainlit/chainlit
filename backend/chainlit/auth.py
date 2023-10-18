import os
from datetime import datetime, timedelta
from typing import Any, Dict

import jwt
from chainlit.client.cloud import AppUser
from chainlit.config import config
from chainlit.data import chainlit_client
from chainlit.oauth_providers import get_configured_oauth_providers
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

reuseable_oauth = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)


def get_jwt_secret():
    return os.environ.get("CHAINLIT_AUTH_SECRET")


def ensure_jwt_secret():
    if require_login() and get_jwt_secret() is None:
        raise ValueError(
            "You must provide a JWT secret in the environment to use password authentication. Run `chainlit create-secret` to generate one."
        )


def is_oauth_enabled():
    return config.code.oauth_callback and len(get_configured_oauth_providers()) > 0


def require_login():
    return (
        config.code.password_auth_callback is not None
        or config.code.header_auth_callback is not None
        or is_oauth_enabled()
    )


def get_configuration():
    return {
        "requireLogin": require_login(),
        "passwordAuth": config.code.password_auth_callback is not None,
        "headerAuth": config.code.header_auth_callback is not None,
        "oauthProviders": get_configured_oauth_providers()
        if is_oauth_enabled()
        else [],
    }


def create_jwt(data: AppUser) -> str:
    to_encode = data.to_dict()  # type: Dict[str, Any]
    to_encode.update(
        {
            "exp": datetime.utcnow() + timedelta(minutes=60 * 24 * 15),  # 15 days
        }
    )
    encoded_jwt = jwt.encode(to_encode, get_jwt_secret(), algorithm="HS256")
    return encoded_jwt


async def authenticate_user(token: str = Depends(reuseable_oauth)):
    try:
        dict = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=["HS256"],
            options={"verify_signature": True},
        )
        del dict["exp"]
        app_user = AppUser(**dict)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    if chainlit_client:
        try:
            persisted_app_user = await chainlit_client.get_app_user(app_user.username)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        if persisted_app_user == None:
            raise HTTPException(status_code=401, detail="User does not exist")

        return persisted_app_user
    else:
        return app_user


async def get_current_user(token: str = Depends(reuseable_oauth)):
    if not require_login():
        return None

    return await authenticate_user(token)
