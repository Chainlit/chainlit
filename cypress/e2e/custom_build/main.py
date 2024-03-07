import chainlit as cl


@cl.on_chat_start
async def main():
    await cl.Message(content="Hello!").send()
