from secrets import token_urlsafe
from typing import Dict, TypedDict, Optional, Callable, Any, Union
from chainlit.client.base import BaseAuthClient, BaseDBClient
from chainlit.types import AskResponse


class Session(TypedDict):
    """Internal session object."""

    # The ID of the session
    id: str
    # Function to ask the user a question
    ask_user: Callable[[Any, Optional[int]], Union[AskResponse, None]]
    # Function to emit a message to the user
    emit: Callable[[str, Any], None]
    # User specific environment variables. Empty if no user environment variables are required.
    user_env: Dict[str, str]
    # Optional langchain agent
    agent: Any
    # Optional llama instance
    llama_instance: Any
    # Whether the current task should be stopped
    should_stop: bool
    # Optional client to authenticate users
    auth_client: Optional[BaseAuthClient]
    # Optional client to persist messages and files
    db_client: Optional[BaseDBClient]


def new_session(key: str, data: Session):
    session_id = token_urlsafe()
    session = data | {"id": session_id}
    sessions[session_id] = session
    sessions_id[key] = session_id
    return session


def restore_session(session: Session, new_key: str):
    # TODO: Remove previous session key
    # sessions_id = {k: v for k, v in sessions_id.items() if v != session["id"]}
    sessions_id[new_key] = session["id"]


def get_session(key: str):
    session_id = sessions_id.get(key)
    return get_session_by_id(session_id)


def delete_session(key: str = None):
    session_id = sessions_id.get(key)
    sessions_id.pop(key)
    sessions.pop(session_id)


def get_session_by_id(session_id: str):
    return sessions.get(session_id)


sessions_id: Dict[str, str] = {}
sessions: Dict[str, Session] = {}
