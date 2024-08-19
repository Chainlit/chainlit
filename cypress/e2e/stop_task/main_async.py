import chainlit as cl


@cl.on_message
async def message(message: cl.Message):
    await cl.Message(content="Message 1").send()
    await cl.sleep(1)
    await cl.Message(content="Message 2").send()
