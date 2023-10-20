import chainlit as cl


@cl.on_chat_start
async def main():
    msg1 = cl.Message(content="Message 1")
    await msg1.send()

    msg1_child1 = cl.Message(content="Child 1", parent_id=msg1.id)
    await msg1_child1.send()
    await cl.sleep(1)
    await msg1_child1.remove()

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
