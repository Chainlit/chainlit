from typing import Optional

import chainlit as cl


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    user = cl.user_session.get("user")
    await cl.Message(f"Hello {user.identifier}").send()
