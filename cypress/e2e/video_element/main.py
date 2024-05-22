import chainlit as cl


@cl.on_chat_start
async def start():
    elements = [
        cl.Video(
            name="example.mp4",
            path="../../fixtures/example.mp4",
            display="inline",
            size="large",
        )
    ]

    await cl.Message(
        content="This message has the example.mp4 video", elements=elements
    ).send()
