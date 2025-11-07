import chainlit as cl

@cl.on_chat_start
async def main():
    await cl.Message("Hello, this is a test message!").send()