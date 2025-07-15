import os

import chainlit as cl

# Get the directory where the current script is located
current_directory = os.path.dirname(os.path.abspath(__file__))
# Construct the absolute path to the fixtures directory (two levels up from current_dir)
fixtures_directory = os.path.abspath(
    os.path.join(current_directory, "..", "..", "fixtures")
)
# Construct the absolute path to the image file
cat_image_path = os.path.join(fixtures_directory, "cat.jpeg")


@cl.on_chat_start
async def start():
    step_image = cl.Image(
        name="image1",
        path=cat_image_path,
    )
    msg_image = cl.Image(
        name="image1",
        path=cat_image_path,
    )

    async with cl.Step(type="tool", name="tool1") as step:
        step.elements = [
            step_image,
            cl.Image(name="image2", path=cat_image_path),
        ]
        step.output = "This step has an image"

    await cl.Message(
        content="This message has an image",
        elements=[
            msg_image,
            cl.Image(name="image2", path=cat_image_path),
        ],
    ).send()
    await msg_image.remove()
    await step_image.remove()
