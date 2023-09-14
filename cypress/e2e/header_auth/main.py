from typing import Optional

from chainlit.types import AppUser

import chainlit as cl


@cl.header_auth_callback
def header_auth_callback(headers) -> Optional[AppUser]:
    if headers.get("test-header"):
        return AppUser(username="admin", role="ADMIN", provider="header")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    app_user = cl.user_session.get("user")
    await cl.Message(f"Hello {app_user.username}").send()
