import asyncio
import json
import mimetypes
import shutil
import uuid
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Deque,
    Dict,
    List,
    Literal,
    Optional,
    Union,
)

import aiofiles
from chainlit.logger import logger

if TYPE_CHECKING:
    from chainlit.message import Message
    from chainlit.step import Step
    from chainlit.types import FileDict, FileReference
    from chainlit.user import PersistedUser, User

ClientType = Literal["webapp", "copilot", "teams", "slack", "discord"]


class JSONEncoderIgnoreNonSerializable(json.JSONEncoder):
    def default(self, obj):
        try:
            return super(JSONEncoderIgnoreNonSerializable, self).default(obj)
        except TypeError:
            return None


def clean_metadata(metadata: Dict, max_size: int = 1048576):
    cleaned_metadata = json.loads(
        json.dumps(metadata, cls=JSONEncoderIgnoreNonSerializable, ensure_ascii=False)
    )

    metadata_size = len(json.dumps(cleaned_metadata).encode("utf-8"))
    if metadata_size > max_size:
        # Redact the metadata if it exceeds the maximum size
        cleaned_metadata = {
            "message": f"Metadata size exceeds the limit of {max_size} bytes. Redacted."
        }

    return cleaned_metadata


class BaseSession:
    """Base object."""

    thread_id_to_resume: Optional[str] = None
    client_type: ClientType
    current_task: Optional[asyncio.Task] = None

    def __init__(
        self,
        # Id of the session
        id: str,
        client_type: ClientType,
        # Thread id
        thread_id: Optional[str],
        # Logged-in user informations
        user: Optional[Union["User", "PersistedUser"]],
        # Logged-in user token
        token: Optional[str],
        # User specific environment variables. Empty if no user environment variables are required.
        user_env: Optional[Dict[str, str]],
        # Chat profile selected before the session was created
        chat_profile: Optional[str] = None,
        # Origin of the request
        http_referer: Optional[str] = None,
    ):
        if thread_id:
            self.thread_id_to_resume = thread_id
        self.thread_id = thread_id or str(uuid.uuid4())
        self.user = user
        self.client_type = client_type
        self.token = token
        self.has_first_interaction = False
        self.user_env = user_env or {}
        self.chat_profile = chat_profile
        self.http_referer = http_referer

        self.files = {}  # type: Dict[str, "FileDict"]

        self.id = id

        self.chat_settings: Dict[str, Any] = {}

    @property
    def files_dir(self):
        from chainlit.config import FILES_DIRECTORY

        return FILES_DIRECTORY / self.id

    async def persist_file(
        self,
        name: str,
        mime: str,
        path: Optional[str] = None,
        content: Optional[Union[bytes, str]] = None,
    ) -> "FileReference":
        if not path and not content:
            raise ValueError(
                "Either path or content must be provided to persist a file"
            )

        self.files_dir.mkdir(exist_ok=True)

        file_id = str(uuid.uuid4())

        file_path = self.files_dir / file_id

        file_extension = mimetypes.guess_extension(mime)

        if file_extension:
            file_path = file_path.with_suffix(file_extension)

        if path:
            # Copy the file from the given path
            async with aiofiles.open(path, "rb") as src, aiofiles.open(
                file_path, "wb"
            ) as dst:
                await dst.write(await src.read())
        elif content:
            # Write the provided content to the file
            async with aiofiles.open(file_path, "wb") as buffer:
                if isinstance(content, str):
                    content = content.encode("utf-8")
                await buffer.write(content)

        # Get the file size
        file_size = file_path.stat().st_size
        # Store the file content in memory
        self.files[file_id] = {
            "id": file_id,
            "path": file_path,
            "name": name,
            "type": mime,
            "size": file_size,
        }

        return {"id": file_id}

    def to_persistable(self) -> Dict:
        from chainlit.user_session import user_sessions

        user_session = user_sessions.get(self.id) or {}  # type: Dict
        user_session["chat_settings"] = self.chat_settings
        user_session["chat_profile"] = self.chat_profile
        user_session["http_referer"] = self.http_referer
        user_session["client_type"] = self.client_type
        metadata = clean_metadata(user_session)
        return metadata


class HTTPSession(BaseSession):
    """Internal HTTP session object. Used to consume Chainlit through API (no websocket)."""

    def __init__(
        self,
        # Id of the session
        id: str,
        client_type: ClientType,
        # Thread id
        thread_id: Optional[str] = None,
        # Logged-in user informations
        user: Optional[Union["User", "PersistedUser"]] = None,
        # Logged-in user token
        token: Optional[str] = None,
        user_env: Optional[Dict[str, str]] = None,
        # Origin of the request
        http_referer: Optional[str] = None,
    ):
        super().__init__(
            id=id,
            thread_id=thread_id,
            user=user,
            token=token,
            client_type=client_type,
            user_env=user_env,
            http_referer=http_referer,
        )

    def delete(self):
        """Delete the session."""
        if self.files_dir.is_dir():
            shutil.rmtree(self.files_dir)


ThreadQueue = Deque[tuple[Callable, object, tuple, Dict]]


class WebsocketSession(BaseSession):
    """Internal web socket session object.

    A socket id is an ephemeral id that can't be used as a session id
    (as it is for instance regenerated after each reconnection).

    The Session object store an internal mapping between socket id and
    a server generated session id, allowing to persists session
    between socket reconnection but also retrieving a session by
    socket id for convenience.
    """

    to_clear: bool = False

    def __init__(
        self,
        # Id from the session cookie
        id: str,
        # Associated socket id
        socket_id: str,
        # Function to emit to the client
        emit: Callable[[str, Any], None],
        # Function to emit to the client and wait for a response
        emit_call: Callable[[Literal["ask", "call_fn"], Any, Optional[int]], Any],
        # User specific environment variables. Empty if no user environment variables are required.
        user_env: Dict[str, str],
        client_type: ClientType,
        # Thread id
        thread_id: Optional[str] = None,
        # Logged-in user informations
        user: Optional[Union["User", "PersistedUser"]] = None,
        # Logged-in user token
        token: Optional[str] = None,
        # Chat profile selected before the session was created
        chat_profile: Optional[str] = None,
        # Languages of the user's browser
        languages: Optional[str] = None,
        # Origin of the request
        http_referer: Optional[str] = None,
    ):
        super().__init__(
            id=id,
            thread_id=thread_id,
            user=user,
            token=token,
            user_env=user_env,
            client_type=client_type,
            chat_profile=chat_profile,
            http_referer=http_referer,
        )

        self.socket_id = socket_id
        self.emit_call = emit_call
        self.emit = emit

        self.restored = False

        self.thread_queues: Dict[str, ThreadQueue] = {}

        ws_sessions_id[self.id] = self
        ws_sessions_sid[socket_id] = self

        self.languages = languages

    def restore(self, new_socket_id: str):
        """Associate a new socket id to the session."""
        ws_sessions_sid.pop(self.socket_id, None)
        ws_sessions_sid[new_socket_id] = self
        self.socket_id = new_socket_id
        self.restored = True

    def delete(self):
        """Delete the session."""
        if self.files_dir.is_dir():
            shutil.rmtree(self.files_dir)
        ws_sessions_sid.pop(self.socket_id, None)
        ws_sessions_id.pop(self.id, None)

    async def flush_method_queue(self):
        for method_name, queue in self.thread_queues.items():
            while queue:
                method, self, args, kwargs = queue.popleft()
                try:
                    await method(self, *args, **kwargs)
                except Exception as e:
                    logger.error(f"Error while flushing {method_name}: {e}")

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
