import chainlit as cl


@cl.on_chat_start
async def start():
    elements = [
        cl.File(
            name="example.mp4",
            path="../../fixtures/example.mp4",
            display="inline",
            mime="video/mp4",
        ),
        cl.File(
            name="cat.jpeg",
            path="../../fixtures/cat.jpeg",
            display="inline",
            mime="image/jpg",
        ),
        cl.File(
            name="hello.py",
            path="../../fixtures/hello.py",
            display="inline",
            mime="plain/py",
        ),
        cl.File(
            name="example.mp3",
            path="../../fixtures/example.mp3",
            display="inline",
            mime="audio/mp3",
        ),
    ]

    await cl.Message(
        content="This message has a couple of file element", elements=elements
    ).send()
