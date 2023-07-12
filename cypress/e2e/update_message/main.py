import chainlit as cl


@cl.on_chat_start
async def main():
    msg = cl.Message(content="Hello!")
    await msg.send()
    await cl.sleep(2)
    msg.content = "Hello again!"
    await msg.update()
