import chainlit as cl


@cl.on_chat_start
def start():
    cl.send_local_image(path="./cat.jpeg", name="image1", display="inline")
    cl.send_text(text="Here is a side text document", name="text1", display="side")
    cl.send_text(text="Here is a page text document", name="text2", display="page")

    msg = "Here is image1, a nice image of a cat! As well as text1 and text2!"
    cl.send_message(
        content=msg,
    )
