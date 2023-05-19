import chainlit as cl


@cl.on_chat_start
def start():
    elements = [
        cl.LocalImage(path="./cat.jpeg", name="image1", display="inline"),
        cl.Text(text="Here is a side text document", name="text1", display="side"),
        cl.Text(text="Here is a page text document", name="text2", display="page"),
    ]

    # Element should not be inlined or referenced
    cl.send_message(
        content="Here is image1, a nice image of a cat! As well as text1 and text2!",
    )
    # Image should be inlined even if not referenced
    cl.send_message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=elements,
    )
