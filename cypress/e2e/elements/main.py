from chainlit.context import context

import chainlit as cl


@cl.step
async def gen_img():
    if current_step := context.current_step:
        current_step.elements = [
            cl.Image(path="./cat.jpeg", name="image1", display="inline")
        ]
    return "Here is a cat!"


@cl.on_chat_start
async def start():
    # Element should not be inlined or referenced
    await cl.Message(
        content="Here is image1, a nice image of a cat! As well as text1 and text2!",
    ).send()

    # Step should be able to have elements
    await gen_img()

    # Image should be inlined even if not referenced
    await cl.Message(
        content="Here a nice image of a cat! As well as text1 and text2!",
        elements=[
            cl.Image(path="./cat.jpeg", name="image1", display="inline"),
            cl.Pdf(path="./dummy.pdf", name="pdf1", display="inline"),
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
            cl.Image(path="./cat.jpeg", name="image1", display="inline"),
            cl.Pdf(path="./dummy.pdf", name="pdf1", display="inline"),
            cl.Text(
                content="Here is a side text document", name="text1", display="side"
            ),
            cl.Text(
                content="Here is a page text document", name="text2", display="page"
            ),
        ],
    ).send()
