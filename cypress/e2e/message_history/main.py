import chainlit as cl


@cl.on_message
async def main():
    await cl.Message(content="ok").send()
