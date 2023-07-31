from typing import TYPE_CHECKING, Any, Callable, Dict, Optional, Union

if TYPE_CHECKING:
    from chainlit.message import Message

from chainlit.client.base import BaseAuthClient, BaseDBClient
from chainlit.types import AskResponse


class Session:
    """Internal session object.

    A socket id is an ephemeral id that can't be used as a session id
    (as it is for instance regenerated after each reconnection).

    The Session object store an internal mapping between socket id and
    a server generated session id, allowing to persists session
    between socket reconnection but also retrieving a session by
    socket id for convenience.
    """

    def __init__(
        self,
        # Id from the session cookie
        id: str,
        # Associated socket id
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
        # Headers received during the websocket connection handshake
        initial_headers: Dict[str, str],
        # Optional langchain agent
        agent: Optional[Any] = None,
        # Optional llama instance
        llama_instance: Optional[Any] = None,
        # Last message at the root of the chat
        root_message: Optional["Message"] = None,
    ):
        self.socket_id = socket_id
        self.ask_user = ask_user
        self.emit = emit
        self.user_env = user_env
        self.initial_headers = initial_headers
        self.agent = agent
        self.llama_instance = llama_instance
        self.auth_client = auth_client
        self.db_client = db_client
        self.root_message = root_message
        self.should_stop = False
        self.restored = False
        self.id = id
        self.chat_settings: Dict[str, Any] = {}

        sessions_id[self.id] = self
        sessions_sid[socket_id] = self

    def restore(self, new_socket_id: str):
        """Associate a new socket id to the session."""
        sessions_sid.pop(self.socket_id, None)
        sessions_sid[new_socket_id] = self
        self.socket_id = new_socket_id
        self.restored = True

    def delete(self):
        """Delete the session."""
        sessions_sid.pop(self.socket_id, None)
        sessions_id.pop(self.id, None)

    @classmethod
    def get(cls, socket_id: str):
        """Get session by socket id."""
        return sessions_sid.get(socket_id)

    @classmethod
    def get_by_id(cls, session_id: str):
        """Get session by session id."""
        return sessions_id.get(session_id)

    @classmethod
    def require(cls, socket_id: str):
        """Throws an exception if the session is not found."""
        if session := cls.get(socket_id):
            return session
        raise ValueError("Session not found")


sessions_sid: Dict[str, Session] = {}
sessions_id: Dict[str, Session] = {}
