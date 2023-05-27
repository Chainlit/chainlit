import chainlit as cl


@cl.on_chat_start
def main():
    raise Exception("This is an error message")
