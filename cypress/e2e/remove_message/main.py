import chainlit as cl


@cl.on_chat_start
def main():
    msg1 = cl.Message(content="Message 1")
    msg1.send()
    msg2 = cl.Message(content="Message 2")
    msg2.send()
    cl.sleep(2)
    msg1.remove()
    cl.sleep(2)
    msg2.remove()
