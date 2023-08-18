from typing import TYPE_CHECKING, Dict, Optional, TypedDict

if TYPE_CHECKING:
    from chainlit.client.base import UserDict
    from chainlit.message import Message

from chainlit.context import context


class UserSessionDict(TypedDict):
    id: str
    env: Dict[str, str]
    user_infos: Optional["UserDict"]
    headers: Dict[str, str]
    root_message: Optional["Message"]


user_sessions: Dict[str, UserSessionDict] = {}


class UserSession:
    """
    Developer facing user session class.
    Useful for the developer to store user specific data between calls.
    """

    def get(self, key, default=None):
        if not context.emitter:
            return default

        if context.session.id not in user_sessions:
            # Create a new user session
            user_sessions[context.session.id] = {}

        user_session = user_sessions[context.session.id]

        # Copy important fields from the session
        user_session["id"] = context.session.id
        user_session["env"] = context.session.user_env
        user_session["user_infos"] = context.session.auth_client.user_infos
        user_session["initial_headers"] = context.session.initial_headers
        user_session["chat_settings"] = context.session.chat_settings

        if context.session.root_message:
            user_session["root_message"] = context.session.root_message

        return user_session.get(key, default)

    def set(self, key, value):
        if not context.emitter:
            return None

        if context.session.id not in user_sessions:
            user_sessions[context.session.id] = {}

        user_session = user_sessions[context.session.id]
        user_session[key] = value


user_session = UserSession()
