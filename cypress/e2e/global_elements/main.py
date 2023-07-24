import asyncio

import chainlit as cl


@cl.on_chat_start
async def start():
    # Send elements to the UI concurrently
    elements = [
        cl.Image(path="./cat.jpeg", name="image1", display="inline").send(),
        cl.Text(
            content="Here is a side text document", name="text1", display="side"
        ).send(),
        cl.Text(
            content="Here is a page text document", name="text2", display="page"
        ).send(),
    ]
    await asyncio.gather(*elements)

    await cl.Message(
        content="Here is image1, a nice image of a cat! As well as text1 and text2!",
    ).send()

    await cl.Message(
        content="Here is a message without element reference!",
    ).send()
