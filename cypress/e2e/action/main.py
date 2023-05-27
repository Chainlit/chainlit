import chainlit as cl


@cl.action_callback("test action")
def on_action():
    cl.Message(content="Executed test action!").send()


@cl.action_callback("removable action")
def on_action(action: cl.Action):
    cl.Message(content="Executed removable action!").send()
    action.remove()


@cl.on_chat_start
def main():
    actions = [
        cl.Action(name="test action", value="test"),
        cl.Action(name="removable action", value="test"),
        cl.Action(name="label action", value="test", label="Test Label"),
    ]
    cl.Message("Hello, this is a test message!", actions=actions).send()
