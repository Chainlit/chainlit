from typing import Optional

from chainlit.types import UserDetails

import chainlit as cl

# @cl.password_auth_callback
# def auth_callback(username: str, password: str) -> Optional[UserDetails]:
#     if (username, password) == ("admin", "admin"):
#         return UserDetails(id="admin", role="admin", provider="credentials")
#     else:
#         return None


@cl.on_chat_start
async def on_chat_start():
    await cl.Message("Hello").send()


@cl.on_message
async def on_message(content: str):
    await cl.Message(f"your msg: {content}").send()
