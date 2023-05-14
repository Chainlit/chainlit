import chainlit as cl


@cl.on_message
def main():
    cl.send_message(content="", author="Tool 1", indent=1)

    cl.sleep(2)

    cl.send_message(
        content="I need to use tool 2",
        author="Tool 1",
        indent=1,
        prompt="Tool 1 prompt",
    )

    cl.send_message(
        content="",
        author="Tool 2",
        indent=2,
    )

    cl.sleep(2)

    cl.send_message(
        content="Response from tool 2",
        author="Tool 2",
        indent=2,
        prompt="Tool 2 prompt",
    )

    cl.send_message(
        content="Response from tool 2",
        author="Tool 1",
        indent=1,
    )

    cl.send_message(
        content="Final response",
    )
