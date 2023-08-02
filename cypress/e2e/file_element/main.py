import chainlit as cl


@cl.on_chat_start
async def start():
    elements = [
        cl.File(
            name="example.mp4",
            path="../../fixtures/example.mp4",
            display="inline",
        ),
        cl.File(
            name="cat.jpeg",
            path="../../fixtures/cat.jpeg",
            display="inline",
        ),
        cl.File(
            name="hello.py",
            path="../../fixtures/hello.py",
            display="inline",
        ),
        cl.File(
            name="example.mp3",
            path="../../fixtures/example.mp3",
            display="inline",
        ),
    ]

    await cl.Message(
        content="This message has a couple of file element", elements=elements
    ).send()
