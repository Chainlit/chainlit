import chainlit as cl


@cl.on_chat_start
async def start():
    await cl.Avatar(
        name="Tool 1",
        url="https://avatars.githubusercontent.com/u/128686189?s=400&u=a1d1553023f8ea0921fba0debbe92a8c5f840dd9&v=4",
    ).send()

    await cl.Avatar(name="Cat", path="./public/cat.jpeg").send()
    await cl.Avatar(name="Cat 2", url="/public/cat.jpeg").send()

    await cl.Message(
        content="This message should not have an avatar!", author="Tool 0"
    ).send()

    await cl.Message(
        content="Tool 1! This message should have an avatar!", author="Tool 1"
    ).send()

    await cl.Message(
        content="This message should not have an avatar!", author="Tool 2"
    ).send()

    await cl.Message(
        content="This message should have a cat avatar!", author="Cat"
    ).send()

    await cl.Message(
        content="This message should have a cat avatar!", author="Cat 2"
    ).send()
