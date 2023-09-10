from typing import Optional

from chainlit.types import AppUser

import chainlit as cl


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[AppUser]:
    if (username, password) == ("admin", "admin"):
        return AppUser(username="admin", role="admin", provider="credentials")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    await cl.Message("Hello").send()
