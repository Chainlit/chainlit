import chainlit as cl


@cl.on_message
def main():
    cl.send_message("ok")
