import os

import chainlit as cl

# Get the directory where the current script is located
current_directory = os.path.dirname(os.path.abspath(__file__))
# Construct the absolute path to the image and pdf files
cat_image_path = os.path.join(current_directory, "cat.jpeg")
pdf_path = os.path.join(current_directory, "dummy.pdf")


@cl.on_chat_start
async def start():
    elements = [
        cl.Image(path=cat_image_path, name="image1"),
        cl.Pdf(path=pdf_path, name="pdf1"),
        cl.Text(content="Here is a side text document", name="text1"),
        cl.Text(content="Here is a page text document", name="text2"),
    ]

    await cl.ElementSidebar.set_elements(elements)
    await cl.ElementSidebar.set_title("Test title")


@cl.on_message
async def message(msg: cl.Message):
    await cl.ElementSidebar.set_elements([cl.Text(content="Text changed!")])
    await cl.ElementSidebar.set_title("Title changed!")

    await cl.sleep(2)

    await cl.ElementSidebar.set_elements([])
