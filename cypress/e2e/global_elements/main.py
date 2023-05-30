import chainlit as cl


@cl.on_chat_start
def start():
    cl.LocalImage(path="./cat.jpeg", name="image1", display="inline").send()
    cl.Text(text="Here is a side text document", name="text1", display="side").send()
    cl.Text(text="Here is a page text document", name="text2", display="page").send()

    cl.Message(
        content="Here is image1, a nice image of a cat! As well as text1 and text2!",
    ).send()

    cl.Message(
        content="Here is a message without element reference!",
    ).send()
