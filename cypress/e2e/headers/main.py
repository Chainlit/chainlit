import chainlit as cl


@cl.on_chat_start
async def start():
    await cl.Message(content=cl.user_session.get("headers", {}).get("host")).send()
