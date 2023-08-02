import chainlit as cl


@cl.on_message
async def main(message: str, message_id: str):
    tool1_msg = cl.Message(content="", author="Tool 1", parent_id=message_id)
    await tool1_msg.send()

    await cl.sleep(1)

    tool1_msg.content = "I need to use tool 2"
    tool1_msg.prompt = "Tool 1 prompt"

    await tool1_msg.update()

    tool2_msg = cl.Message(content="", author="Tool 2", parent_id=tool1_msg.id)

    await tool2_msg.send()

    await cl.sleep(1)

    tool2_msg.content = "Response from tool 2"
    tool2_msg.prompt = "Tool 2 prompt"

    await tool2_msg.update()

    await cl.Message(
        content="Response from tool 2", author="Tool 1", parent_id=message_id
    ).send()

    await cl.Message(
        content="Final response",
    ).send()
