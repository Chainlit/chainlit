import chainlit as cl


@cl.on_chat_start
async def start():
    await cl.Message(content="Hello").send()

    elements = [
        cl.Image(path="./cat.jpeg", name="image1"),
        cl.Pdf(path="./dummy.pdf", name="pdf1"),
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
