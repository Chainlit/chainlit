import chainlit as cl


@cl.on_message
async def main(message: cl.Message):
    prev_msg = cl.user_session.get("prev_msg")
    await cl.Message(content=f"Prev message: {prev_msg}").send()
    cl.user_session.set("prev_msg", message.content)
