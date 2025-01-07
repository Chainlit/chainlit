import chainlit as cl


@cl.action_callback("test")
async def on_test_action():
    await cl.sleep(1)
    await cl.Message(content="Executed test action!").send()


@cl.on_chat_start
async def on_start():
    custom_element = cl.CustomElement(
        name="Counter", display="inline", props={"count": 1}
    )
    await cl.Message(
        content="This message has a custom element!", elements=[custom_element]
    ).send()
