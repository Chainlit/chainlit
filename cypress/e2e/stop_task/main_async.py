import chainlit as cl


@cl.on_chat_start
async def start():
    await cl.Message(content="Message 1").send()
    await cl.sleep(1)
    await cl.Message(content="Message 2").send()


@cl.on_message
async def message(message: cl.Message):
    await cl.Message(content="World").send()
