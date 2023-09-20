from typing import Optional

import chainlit as cl


@cl.header_auth_callback
def header_auth_callback(headers) -> Optional[cl.AppUser]:
    if headers.get("test-header"):
        return cl.AppUser(username="admin", role="ADMIN", provider="header")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    app_user = cl.user_session.get("user")
    await cl.Message(f"Hello {app_user.username}").send()
