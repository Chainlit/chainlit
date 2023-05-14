import chainlit as cl


@cl.on_chat_start
def main():
    res = cl.ask_for_input(content="What is your name?", timeout=10)
    if res:
        cl.send_message(
            content=f"Your name is: {res['content']}",
        )
