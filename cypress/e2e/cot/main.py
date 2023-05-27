import chainlit as cl


@cl.on_message
def main():
    cl.Message(content="", author="Tool 1", indent=1).send()

    cl.sleep(2)

    cl.Message(
        content="I need to use tool 2",
        author="Tool 1",
        indent=1,
        prompt="Tool 1 prompt",
    ).send()

    cl.Message(
        content="",
        author="Tool 2",
        indent=2,
    ).send()

    cl.sleep(2)

    cl.Message(
        content="Response from tool 2",
        author="Tool 2",
        indent=2,
        prompt="Tool 2 prompt",
    ).send()

    cl.Message(
        content="Response from tool 2",
        author="Tool 1",
        indent=1,
    ).send()

    cl.Message(
        content="Final response",
    ).send()
