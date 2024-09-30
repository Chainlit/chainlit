import chainlit as cl


@cl.on_chat_start
async def main():
    msg1 = cl.Message(content="Message 1")
    await msg1.send()

    await cl.sleep(1)

    async with cl.Step(type="tool", name="tool1") as child1:
        child1.output = "Child 1"

    await cl.sleep(1)
    await child1.remove()

    msg2 = cl.Message(content="Message 2")
    await msg2.send()

    await cl.sleep(1)
    await msg1.remove()

    await cl.sleep(1)
    await msg2.remove()

    await cl.sleep(1)

    ask_msg = cl.AskUserMessage("Message 3")
    await ask_msg.send()

    await cl.sleep(1)
    await ask_msg.remove()
