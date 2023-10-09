from typing import Optional

import chainlit as cl


@cl.on_chat_start
async def main():
    await cl.Message("Hello, send me a message!").send()


@cl.on_message
async def handle_message():
    await cl.Message("Ok!").send()


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.AppUser]:
    if (username, password) == ("admin", "admin"):
        return cl.AppUser(username="admin", role="ADMIN", provider="credentials")
    else:
        return None
