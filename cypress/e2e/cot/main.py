import chainlit as cl


@cl.on_message
async def main():
    await cl.Message(content="", author="Tool 1", indent=1).send()

    await cl.sleep(2)

    await cl.Message(
        content="I need to use tool 2",
        author="Tool 1",
        indent=1,
        prompt="Tool 1 prompt",
    ).send()

    await cl.Message(
        content="",
        author="Tool 2",
        indent=2,
    ).send()

    await cl.sleep(2)

    await cl.Message(
        content="Response from tool 2",
        author="Tool 2",
        indent=2,
        prompt="Tool 2 prompt",
    ).send()

    await cl.Message(
        content="Response from tool 2",
        author="Tool 1",
        indent=1,
    ).send()

    await cl.Message(
        content="Final response",
    ).send()
