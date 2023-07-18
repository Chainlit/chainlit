import chainlit as cl


@cl.on_chat_start
async def start():
    header_value = cl.user_session.get("headers", {}).get(
        "test-header", "header not found"
    )
    await cl.Message(content=header_value).send()
