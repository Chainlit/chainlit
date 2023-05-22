import chainlit as cl


@cl.action_callback("test action")
def on_action():
    cl.send_message("Executed test action!")


@cl.action_callback("removable action")
def on_action(action: cl.Action):
    cl.send_message("Executed removable action!")
    action.remove()


@cl.on_chat_start
def main():
    actions = [
        cl.Action(name="test action", value="test"),
        cl.Action(name="removable action", value="test"),
    ]
    cl.send_message("Hello, this is a test message!", actions=actions)
