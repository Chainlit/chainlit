import datetime
import os
from typing import Any, Dict, Optional

import jwt as pyjwt

from chainlit.config import config
from chainlit.user import User


def get_jwt_secret() -> Optional[str]:
    return os.environ.get("CHAINLIT_AUTH_SECRET")


def create_jwt(data: User) -> str:
    to_encode: Dict[str, Any] = data.to_dict()
    to_encode.update(
        {
            "exp": datetime.datetime.utcnow()
            + datetime.timedelta(seconds=config.project.user_session_timeout),
        }
    )
    secret = get_jwt_secret()
    assert secret
    encoded_jwt = pyjwt.encode(to_encode, secret, algorithm="HS256")
    return encoded_jwt


def decode_jwt(token: str) -> User:
    dict = pyjwt.decode(
        token,
        get_jwt_secret(),
        algorithms=["HS256"],
        options={"verify_signature": True},
    )
    del dict["exp"]
    return User(**dict)
