from typing import Optional

import chainlit as cl


@cl.header_auth_callback
async def header_auth_callback(headers) -> Optional[cl.User]:
    if headers.get("test-header"):
        return cl.User(identifier="admin")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    user = cl.user_session.get("user")
    await cl.Message(f"Hello {user.identifier}").send()
