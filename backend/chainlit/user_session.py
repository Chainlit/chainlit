from typing import Dict

from chainlit.context import context

user_sessions: Dict[str, Dict] = {}


class UserSession:
    """
    Developer facing user session class.
    Useful for the developer to store user specific data between calls.
    """

    def get(self, key, default=None):
        if not context.session:
            return default

        if context.session.id not in user_sessions:
            # Create a new user session
            user_sessions[context.session.id] = {}

        user_session = user_sessions[context.session.id]

        # Copy important fields from the session
        user_session["id"] = context.session.id
        user_session["env"] = context.session.user_env
        user_session["chat_settings"] = context.session.chat_settings
        user_session["user"] = context.session.user
        user_session["chat_profile"] = context.session.chat_profile

        if context.session.root_message:
            user_session["root_message"] = context.session.root_message

        return user_session.get(key, default)

    def set(self, key, value):
        if not context.session:
            return None

        if context.session.id not in user_sessions:
            user_sessions[context.session.id] = {}

        user_session = user_sessions[context.session.id]
        user_session[key] = value


user_session = UserSession()
