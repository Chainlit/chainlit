import os
from typing import Optional
import chainlit as cl

os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"  # nosec B105

@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin")
    else:
        return None

@cl.on_chat_start
async def on_start():
    await cl.Message(content="Hello world!").send()