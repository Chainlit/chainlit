import os

import chainlit as cl

# Get the directory where the current script is located
current_directory = os.path.dirname(os.path.abspath(__file__))
# Construct the absolute path to the image file
cat_image_path = os.path.join(current_directory, "cat.jpeg")
pdf_path = os.path.join(current_directory, "dummy.pdf")


@cl.step(type="tool")
async def gen_img():
    return cl.Image(path=cat_image_path, name="image1")


@cl.on_chat_start
async def start():
    img = await gen_img()

    # Element should not be inlined or referenced
    await cl.Message(
        content="Here is image1, a nice image of a cat!", elements=[img]
    ).send()

    # Image should be inlined even if not referenced
    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=[
            cl.Image(path=cat_image_path, name="image1"),
            cl.Pdf(path=pdf_path, name="pdf1"),
            cl.Text(
                content="Here is a side text document", name="text1", display="side"
            ),
            cl.Text(
                content="Here is a page text document", name="text2", display="page"
            ),
        ],
    ).send()
    # Element references should work even if element names collide
    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=[
            cl.Image(path=cat_image_path, name="image1"),
            cl.Pdf(path=pdf_path, name="pdf1"),
            cl.Text(
                content="Here is a side text document", name="text1", display="side"
            ),
            cl.Text(
                content="Here is a page text document", name="text2", display="page"
            ),
        ],
    ).send()
