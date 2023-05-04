from typing import Dict
from chainlit.sdk import get_sdk

user_sessions: Dict[str, Dict] = {}


class UserSession:
    """
    Developer facing user session class.
    Useful for the developer to store user specific data between calls.
    """

    def get(self, key):
        sdk = get_sdk()
        if not sdk:
            return None

        if sdk.session["id"] not in user_sessions:
            # Create a new user session
            user_sessions[sdk.session["id"]] = {}

        user_session = user_sessions[sdk.session["id"]]

        # Copy important fields from the SDK session
        user_session["id"] = sdk.session["id"]
        user_session["env"] = sdk.session["user_env"]
        if "agent" in sdk.session:
            user_session["agent"] = sdk.session["agent"]

        return user_session.get(key)

    def set(self, key, value):
        sdk = get_sdk()
        if not sdk:
            return None

        if sdk.session["id"] not in user_sessions:
            user_sessions[sdk.session["id"]] = {}

        user_session = user_sessions[sdk.session["id"]]
        user_session[key] = value


user_session = UserSession()
