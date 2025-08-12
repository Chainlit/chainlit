import chainlit as cl


@cl.on_chat_start
async def main():
    await cl.Message("Hello, this is a test message!").send()


@cl.on_message
async def on_message(message: cl.Message):
    await cl.sleep(5)
    await cl.Message(f"Received message: {message.content}").send()
