import chainlit as cl


@cl.set_starters
async def starters():
    return [
        cl.Starter(label="test1", message="Running starter 1"),
        cl.Starter(label="test2", message="Running starter 2"),
        cl.Starter(label="test3", message="Running starter 3"),
    ]


@cl.on_message
async def on_message(msg: cl.Message):
    await cl.Message(msg.content).send()
