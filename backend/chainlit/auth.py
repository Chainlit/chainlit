from datetime import datetime, timedelta
from typing import Dict

import jwt
from chainlit.types import UserDetails
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from chainlit import config

reuseable_oauth = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)


def require_login():
    return (
        config.code.password_auth_callback is not None
        or config.code.header_auth_callback is not None
    )


def get_configuration():
    return {
        "requireLogin": require_login(),
        "passwordAuth": config.code.password_auth_callback is not None,
        "headerAuth": config.code.header_auth_callback is not None,
        "oauthProviders": [],
    }


def create_jwt(data: UserDetails) -> str:
    to_encode = data.to_dict()
    to_encode.update(
        {
            "exp": datetime.utcnow() + timedelta(minutes=60 * 24 * 15),  # 15 days
        }
    )
    encoded_jwt = jwt.encode(to_encode, config.project.secret_token, algorithm="HS256")
    return encoded_jwt


async def get_current_user(token: str = Depends(reuseable_oauth)):
    if not require_login():
        return None

    try:
        dict = jwt.decode(
            token,
            config.project.secret_token,
            algorithms=["HS256"],
            options={"verify_signature": True},
        )
        del dict["exp"]
        user_details = UserDetails(**dict)
        return user_details
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
