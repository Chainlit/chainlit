import chainlit as cl


@cl.on_chat_start
async def main():
    msg1 = cl.Message(content="Message 1")
    await msg1.send()
    msg2 = cl.Message(content="Message 2")
    await msg2.send()
    await cl.sleep(2)
    await msg1.remove()
    await cl.sleep(2)
    await msg2.remove()
