import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, cast

import jwt as pyjwt

from chainlit.config import config
from chainlit.user import User


def get_jwt_secret() -> Optional[str]:
    return os.environ.get("CHAINLIT_AUTH_SECRET")


def create_jwt(data: User) -> str:
    to_encode = cast(Dict[str, Any], data.to_dict().copy())
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(
        seconds=config.project.user_session_timeout
    )
    to_encode["iat"] = datetime.now(timezone.utc)

    secret = get_jwt_secret()
    assert secret
    encoded_jwt = pyjwt.encode(to_encode, secret, algorithm="HS256")
    return encoded_jwt


def decode_jwt(token: str) -> User:
    secret = get_jwt_secret()
    assert secret

    payload = pyjwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        options={"verify_signature": True},
    )
    del payload["exp"]
    return User(**payload)
