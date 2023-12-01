import chainlit as cl


@cl.on_chat_start
async def main():
    msg = cl.Message(content="Hello!")
    await msg.send()

    async with cl.Step() as step:
        step.output = "Foo"

    await cl.sleep(1)
    msg.content = "Hello again!"
    await msg.update()

    step.output += " Bar"
    await step.update()
