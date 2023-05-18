import chainlit as cl


@cl.action("test action")
def on_action():
    cl.send_message("Executed test action!")


@cl.action("removable action")
def on_action(action):
    cl.send_message("Executed removable action!")
    cl.remove_action(action)


@cl.on_chat_start
def main():
    id = cl.send_message("Hello, this is a test message!")
    cl.send_action(name="test action", value="test", for_id=id)
    cl.send_action(name="removable action", value="test", for_id=id)
