from datetime import datetime, timedelta
from typing import Dict

import jwt
from chainlit.types import UserDetails
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from chainlit import config

reuseable_oauth = OAuth2PasswordBearer(tokenUrl="/login")


def get_configuration():
    return {
        # Later requireLogin will also take into account the oauth providers
        "requireLogin": config.code.password_auth_callback is not None,
        "passwordAuth": config.code.password_auth_callback is not None,
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
    except jwt.PyJWTError as e:
        pass

    return None
