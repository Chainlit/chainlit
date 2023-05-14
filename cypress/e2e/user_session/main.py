import chainlit as cl


@cl.on_message
def main(message: str):
    prev_msg = cl.user_session.get("prev_msg")
    cl.send_message(f"Prev message: {prev_msg}")
    cl.user_session.set("prev_msg", message)
