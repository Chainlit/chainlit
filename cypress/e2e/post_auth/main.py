import asyncio
from typing import Optional

import chainlit as cl


@cl.post_auth_callback
def post_auth_callback(request) -> Optional[cl.User]:
    if not request:
        return None

    async def get_body_json_obj():
        body = await request.json()
        return body

    result = asyncio.run(get_body_json_obj())
    if result.get("token"):
        return cl.User(identifier="admin")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    user = cl.user_session.get("user")
    await cl.Message(f"Hello {user.identifier}").send()
