import chainlit as cl


@cl.on_message
async def start():
    await cl.Text(
        content="Here is a global text", name="global text1", display="side"
    ).send(),

    elements = [
        cl.Image(path="./cat.jpeg", name="image1", display="inline"),
        cl.Text(content="Here is a side text document", name="text1", display="side"),
        cl.Text(content="Here is a page text document", name="text2", display="page"),
    ]

    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=elements,
    ).send()

    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=elements,
    ).send()

    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2! Plus global text1!",
        elements=elements,
    ).send()
