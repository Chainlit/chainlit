import datetime
import os
from typing import Any, Dict

import jwt

from chainlit.config import config
from chainlit.user import User


def get_jwt_secret() -> str:
    secret = os.environ.get("CHAINLIT_AUTH_SECRET")
    assert secret
    return secret


def create_jwt(data: User) -> str:
    to_encode: Dict[str, Any] = data.to_dict()
    to_encode.update(
        {
            "exp": datetime.datetime.utcnow()
            + datetime.timedelta(seconds=config.project.user_session_timeout),
        }
    )
    encoded_jwt = jwt.encode(to_encode, get_jwt_secret(), algorithm="HS256")
    return encoded_jwt


def decode_jwt(token: str) -> User:
    dict = jwt.decode(
        token,
        get_jwt_secret(),
        algorithms=["HS256"],
        options={"verify_signature": True},
    )
    del dict["exp"]
    return User(**dict)
