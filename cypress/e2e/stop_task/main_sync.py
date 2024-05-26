import time

import chainlit as cl


def sync_function():
    time.sleep(1)


@cl.on_message
async def message(message: cl.Message):
    await cl.Message(content="Message 1").send()
    await cl.make_async(sync_function)()
    await cl.Message(content="Message 2").send()
