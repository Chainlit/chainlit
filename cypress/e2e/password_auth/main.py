from typing import Optional

import chainlit as cl


@cl.password_auth_callback
async def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    user = cl.user_session.get("user")
    assert user
    await cl.Message(f"Hello {user.identifier}").send()

    text_content = "Hello, this is a text element."
    elements = [cl.Text(name="simple_text", content=text_content, display="inline")]

    await cl.Message(
        content="Check out this text element!",
        elements=elements,
    ).send()
