from secrets import token_urlsafe
from typing import Dict, Optional, Callable, Any, Union
from chainlit.client.base import BaseAuthClient, BaseDBClient
from chainlit.types import AskResponse


class Session:
    """Internal session object."""

    def __init__(
        self,
        # Session key
        socket_id: str,
        # Function to emit a message to the user
        emit: Callable[[str, Any], None],
        # Function to ask the user a question
        ask_user: Callable[[Any, Optional[int]], Union[AskResponse, None]],
        # Optional client to authenticate users
        auth_client: Optional[BaseAuthClient],
        # Optional client to persist messages and files
        db_client: Optional[BaseDBClient],
        # User specific environment variables. Empty if no user environment variables are required.
        user_env: Dict[str, str],
        # Optional langchain agent
        agent: Any = None,
        # Optional llama instance
        llama_instance: Any = None,
    ):
        self.socket_id = socket_id
        self.ask_user = ask_user
        self.emit = emit
        self.user_env = user_env
        self.agent = agent
        self.llama_instance = llama_instance
        self.auth_client = auth_client
        self.db_client = db_client
        self.should_stop = False
        self.id = token_urlsafe()

        sessions_id[self.id] = self
        sessions_sid[socket_id] = self

    def restore(self, new_socket_id: str):
        sessions_sid.pop(self.socket_id, None)
        sessions_sid[new_socket_id] = self
        self.socket_id = new_socket_id

    def delete(self):
        sessions_sid.pop(self.socket_id, None)
        sessions_id.pop(self.id, None)

    @classmethod
    def get(cls, socket_id: str):
        return sessions_sid.get(socket_id)

    @classmethod
    def get_by_id(cls, session_id: str):
        return sessions_id.get(session_id)

    @classmethod
    def require(cls, socket_id: str):
        if session := cls.get(socket_id):
            return session
        raise ValueError("Session not found")


sessions_sid: Dict[str, Session] = {}
sessions_id: Dict[str, Session] = {}
