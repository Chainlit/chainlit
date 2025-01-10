import chainlit as cl


@cl.action_callback("test action")
async def on_test_action():
    await cl.Message(content="Executed test action!").send()


@cl.action_callback("removable action")
async def on_removable_action(action: cl.Action):
    await cl.Message(content="Executed removable action!").send()
    await action.remove()


@cl.action_callback("multiple actions")
async def on_multiple_actions(action: cl.Action):
    await cl.Message(content=f"Action(id={action.id}) has been removed!").send()
    await action.remove()


@cl.action_callback("all actions removed")
async def on_all_actions_removed(_: cl.Action):
    await cl.Message(content="All actions have been removed!").send()
    to_remove = cl.user_session.get("to_remove")  # type: cl.Message
    await to_remove.remove_actions()


@cl.on_chat_start
async def main():
    actions = [
        cl.Action(id="test-action", name="test action", payload={"value": "test"}),
        cl.Action(
            id="removable-action", name="removable action", payload={"value": "test"}
        ),
        cl.Action(
            id="label-action",
            name="label action",
            payload={"value": "test"},
            label="Test Label",
        ),
        cl.Action(
            id="multiple-action-one",
            name="multiple actions",
            payload={"value": "multiple action one"},
            label="multiple action one",
        ),
        cl.Action(
            id="multiple-action-two",
            name="multiple actions",
            payload={"value": "multiple action two"},
            label="multiple action two",
        ),
        cl.Action(
            id="all-actions-removed",
            name="all actions removed",
            payload={"value": "test"},
        ),
    ]
    message = cl.Message("Hello, this is a test message!", actions=actions)
    cl.user_session.set("to_remove", message)
    await message.send()

    result = await cl.AskActionMessage(
        content="Please, pick an action!",
        actions=[
            cl.Action(
                id="first-action",
                name="first_action",
                payload={"value": "first-action"},
                label="First action",
            ),
            cl.Action(
                id="second-action",
                name="second_action",
                payload={"value": "second-action"},
                label="Second action",
            ),
        ],
    ).send()

    if result is not None:
        await cl.Message(f"Thanks for pressing: {result['payload']['value']}").send()
