import chainlit as cl


@cl.on_chat_start
async def start():
    elements = [
        cl.Video(
            name="example.mp4",
            path="../../fixtures/example.mp4",
            display="inline",
            size="large",
        ),
        cl.Video(
            name="video2",
            display="inline",
            url="https://www.youtube-nocookie.com/watch?v=EtH9Yllzjcc",
            player_config={
                "youtube": {
                    "playerVars": {
                        "autoplay": 1,
                        "start": 36,
                    }
                },
            },
        ),
        cl.Video(
            name="video3",
            display="inline",
            url="https://vimeo.com/362164795",
            player_config={
                "vimeo": {
                    "title": "Custom Title for Chainlit testing",
                    "playerOptions": {
                        "autoplay": True,
                        "muted": True,
                        "start_time": 36,
                    },
                },
            },
        ),
    ]

    await cl.Message(
        content="This message has the example.mp4 video, a YouTube video and a Vimeo video",
        elements=elements,
    ).send()
