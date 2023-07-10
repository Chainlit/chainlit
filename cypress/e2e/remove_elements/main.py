import chainlit as cl


@cl.on_chat_start
async def start():
    image = cl.Image(name="image1", display="inline", path="../../fixtures/cat.jpeg")

    await cl.Message(
        content="This message has an image",
        elements=[
            image,
            cl.Image(name="image2", display="inline", path="../../fixtures/cat.jpeg"),
        ],
    ).send()
    await image.remove()
