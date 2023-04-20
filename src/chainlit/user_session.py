from typing import Dict
from chainlit.sdk import get_sdk

user_sessions: Dict[str, Dict] = {}


class UserSession():
    def get(self, key):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return None
        if sdk.session["id"] not in user_sessions:
            user_sessions[sdk.session["id"]] = {}

        user_session = user_sessions[sdk.session["id"]]
        user_session["id"] = sdk.session["id"]
        user_session["env"] = sdk.session["user_env"]

        return user_session.get(key)

    def set(self, key, value):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return None
        if sdk.session["id"] not in user_sessions:
            user_sessions[sdk.session["id"]] = {}

        user_session = user_sessions[sdk.session["id"]]
        user_session[key] = value

user_session = UserSession()