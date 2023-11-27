import json
import uuid
from typing import TYPE_CHECKING, Any, Callable, Deque, Dict, Optional, Union

if TYPE_CHECKING:
    from chainlit.message import Message
    from chainlit.types import AskResponse
    from chainlit.user import AppUser, PersistedAppUser


class JSONEncoderIgnoreNonSerializable(json.JSONEncoder):
    def default(self, obj):
        try:
            return super(JSONEncoderIgnoreNonSerializable, self).default(obj)
        except TypeError:
            return None


def clean_metadata(metadata: Dict):
    return json.loads(
        json.dumps(metadata, cls=JSONEncoderIgnoreNonSerializable, ensure_ascii=False)
    )


class BaseSession:
    """Base object."""

    def __init__(
        self,
        # Id of the session
        id: str,
        # Thread id
        thread_id: Optional[str],
        # Logged-in user informations
        user: Optional[Union["AppUser", "PersistedAppUser"]],
        # Logged-in user token
        token: Optional[str],
        # User specific environment variables. Empty if no user environment variables are required.
        user_env: Optional[Dict[str, str]],
        # Last message at the root of the chat
        root_message: Optional["Message"] = None,
        # Chat profile selected before the session was created
        chat_profile: Optional[str] = None,
    ):
        self.thread_id = thread_id or str(uuid.uuid4())
        self.user = user
        self.token = token
        self.root_message = root_message
        self.has_user_message = False
        self.user_env = user_env or {}
        self.chat_profile = chat_profile

        self.id = id

        self.chat_settings: Dict[str, Any] = {}

    def to_persistable(self) -> Dict:
        from chainlit.user_session import user_sessions

        user_session = user_sessions.get(self.id) or {}  # type: Dict
        user_session["chat_settings"] = self.chat_settings
        user_session["chat_profile"] = self.chat_profile
        metadata = clean_metadata(user_session)
        return metadata


class HTTPSession(BaseSession):
    """Internal HTTP session object. Used to consume Chainlit through API (no websocket)."""

    def __init__(
        self,
        # Id of the session
        id: str,
        # Thread id
        thread_id: Optional[str] = None,
        # Logged-in user informations
        user: Optional[Union["AppUser", "PersistedAppUser"]] = None,
        # Logged-in user token
        token: Optional[str] = None,
        user_env: Optional[Dict[str, str]] = None,
        # Last message at the root of the chat
        root_message: Optional["Message"] = None,
        # User specific environment variables. Empty if no user environment variables are required.
    ):
        super().__init__(
            id=id,
            thread_id=thread_id,
            user=user,
            token=token,
            user_env=user_env,
            root_message=root_message,
        )


class WebsocketSession(BaseSession):
    """Internal web socket session object.

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
        ask_user: Callable[[Any, Optional[int]], Union["AskResponse", None]],
        # User specific environment variables. Empty if no user environment variables are required.
        user_env: Dict[str, str],
        # Thread id
        thread_id: Optional[str] = None,
        # Logged-in user informations
        user: Optional[Union["AppUser", "PersistedAppUser"]] = None,
        # Logged-in user token
        token: Optional[str] = None,
        # Last message at the root of the chat
        root_message: Optional["Message"] = None,
        # Chat profile selected before the session was created
        chat_profile: Optional[str] = None,
    ):
        super().__init__(
            id=id,
            thread_id=thread_id,
            user=user,
            token=token,
            user_env=user_env,
            root_message=root_message,
            chat_profile=chat_profile,
        )

        self.socket_id = socket_id
        self.ask_user = ask_user
        self.emit = emit

        self.should_stop = False
        self.restored = False

        self.thread_queues = {}  # type: Dict[str, Deque[Callable]]

        ws_sessions_id[self.id] = self
        ws_sessions_sid[socket_id] = self

    def restore(self, new_socket_id: str):
        """Associate a new socket id to the session."""
        ws_sessions_sid.pop(self.socket_id, None)
        ws_sessions_sid[new_socket_id] = self
        self.socket_id = new_socket_id
        self.restored = True

    def delete(self):
        """Delete the session."""
        ws_sessions_sid.pop(self.socket_id, None)
        ws_sessions_id.pop(self.id, None)

    async def flush_method_queue(self):
        for method_name, queue in self.thread_queues.items():
            while queue:
                method, args, kwargs = queue.popleft()
                await method(*args, **kwargs)

    @classmethod
    def get(cls, socket_id: str):
        """Get session by socket id."""
        return ws_sessions_sid.get(socket_id)

    @classmethod
    def get_by_id(cls, session_id: str):
        """Get session by session id."""
        return ws_sessions_id.get(session_id)

    @classmethod
    def require(cls, socket_id: str):
        """Throws an exception if the session is not found."""
        if session := cls.get(socket_id):
            return session
        raise ValueError("Session not found")


ws_sessions_sid: Dict[str, WebsocketSession] = {}
ws_sessions_id: Dict[str, WebsocketSession] = {}
