import chainlit as cl


@cl.action("action1")
def on_action():
    cl.send_message("Executed action 1!")


@cl.on_chat_start
def main():
    cl.send_message("Hello, here is a clickable action!")
    cl.send_action(name="action1", trigger="clickable action",
                   description="Click on this to run action1!")
