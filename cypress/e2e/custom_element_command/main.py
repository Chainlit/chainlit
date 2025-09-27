import chainlit as cl


@cl.on_chat_start
async def on_start():
    custom_element = cl.CustomElement(name="Commander")
    await cl.Message(
        content="This message has a custom element!", elements=[custom_element]
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    if message.command:
        await cl.Message(content=f"Received command: {message.command}").send()
