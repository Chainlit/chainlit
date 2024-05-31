import chainlit as cl


@cl.on_chat_start
async def start():
    step_image = cl.Image(
        name="image1", display="inline", path="../../fixtures/cat.jpeg"
    )
    msg_image = cl.Image(
        name="image1", display="inline", path="../../fixtures/cat.jpeg"
    )

    async with cl.Step(type="tool", name="tool1") as step:
        step.elements = [
            step_image,
            cl.Image(name="image2", display="inline", path="../../fixtures/cat.jpeg"),
        ]
        step.output = "This step has an image"

    await cl.Message(
        content="This message has an image",
        elements=[
            msg_image,
            cl.Image(name="image2", display="inline", path="../../fixtures/cat.jpeg"),
        ],
    ).send()
    await msg_image.remove()
    await step_image.remove()
