import chainlit as cl


@cl.on_message
def main():
    cl.Message(content="ok").send()
