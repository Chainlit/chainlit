import chainlit as cl


@cl.on_chat_start
def main():
    res = cl.AskUser(content="What is your name?", timeout=10).send()
    if res:
        cl.Message(
            content=f"Your name is: {res['content']}",
        ).send()
