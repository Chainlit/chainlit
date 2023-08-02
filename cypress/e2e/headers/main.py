import chainlit as cl


@cl.on_chat_start
async def start():
    headers = cl.user_session.get("initial_headers", {})

    await cl.Message(content=headers.get("host")).send()

    await cl.Message(content=headers.get("test-header", "header not found")).send()
