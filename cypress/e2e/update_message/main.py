import chainlit as cl


@cl.on_chat_start
def main():
    msg = cl.Message(content="Hello!")
    msg.send()
    cl.sleep(2)
    msg.update(content="Hello again!")
