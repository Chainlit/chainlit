import chainlit as cl


@cl.on_message
def main(message: str):
    prev_msg = cl.user_session.get("prev_msg")
    cl.Message(content=f"Prev message: {prev_msg}").send()
    cl.user_session.set("prev_msg", message)
