import chainlit as cl


@cl.on_window_message
async def window_message(message: str):
    if message.startswith("Client: "):
        cl.send_window_message("Server: World")


@cl.on_message
async def message(message: str):
    await cl.Message(content="ok").send()
