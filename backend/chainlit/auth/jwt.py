import os
from datetime import datetime, timedelta, timezone
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
            "exp": datetime.now(timezone.utc)
            + timedelta(seconds=config.project.user_session_timeout),
            "iat": datetime.now(timezone.utc),  # Add issued at time
        }
    )

    secret = get_jwt_secret()
    assert secret
    encoded_jwt = pyjwt.encode(to_encode, secret, algorithm="HS256")
    return encoded_jwt


def encode_client_side_session(client_side_session: Dict[str, Any]):
    client_side_session.update(
        {
            "exp": datetime.now(timezone.utc)
            + timedelta(seconds=config.project.user_session_timeout),
            "iat": datetime.now(timezone.utc),
        }
    )
    return pyjwt.encode(client_side_session, get_jwt_secret(), algorithm="HS256")


def decode_jwt(token: str) -> User:
    dict = pyjwt.decode(
        token,
        get_jwt_secret(),
        algorithms=["HS256"],
        options={"verify_signature": True},
    )
    del dict["exp"]
    return User(**dict)


def decode_client_side_session(encoded_client_side_session: str) -> Dict[str, Any]:
    client_side_session = pyjwt.decode(
        encoded_client_side_session,
        get_jwt_secret(),
        algorithms=["HS256"],
        options={"verify_signature": True},
    )
    del client_side_session["exp"]
    return client_side_session
