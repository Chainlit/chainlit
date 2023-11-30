import chainlit as cl


@cl.on_chat_start
async def start():
    elements = [
        cl.Image(path="./cat.jpeg", name="image1", display="inline"),
        cl.Pdf(path="./dummy.pdf", name="pdf1", display="inline"),
        cl.Text(content="Here is a side text document", name="text1", display="side"),
        cl.Text(content="Here is a page text document", name="text2", display="page"),
    ]

    # Element should not be inlined or referenced
    await cl.Message(
        content="Here is image1, a nice image of a cat! As well as text1 and text2!",
    ).send()
    # Image should be inlined even if not referenced
    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=elements,
    ).send()
    # Element references should work even if element names collide
    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=elements,
    ).send()
