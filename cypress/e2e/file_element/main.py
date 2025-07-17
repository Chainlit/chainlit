import os

import chainlit as cl

# Get the directory where the current script is located
current_directory = os.path.dirname(os.path.abspath(__file__))
# Construct the absolute path to the fixtures directory (two levels up from current_dir)
fixtures_directory = os.path.abspath(
    os.path.join(current_directory, "..", "..", "fixtures")
)

# Construct absolute paths for each file
mp4_path = os.path.join(fixtures_directory, "example.mp4")
jpeg_path = os.path.join(fixtures_directory, "cat.jpeg")
python_file_path = os.path.join(fixtures_directory, "hello.py")
mp3_path = os.path.join(fixtures_directory, "example.mp3")


@cl.on_chat_start
async def start():
    elements = [
        cl.File(
            name="example.mp4",
            path=mp4_path,
            mime="video/mp4",
        ),
        cl.File(
            name="cat.jpeg",
            path=jpeg_path,
            mime="image/jpg",
        ),
        cl.File(
            name="hello.py",
            path=python_file_path,
            mime="plain/py",
        ),
        cl.File(
            name="example.mp3",
            path=mp3_path,
            mime="audio/mp3",
        ),
    ]

    await cl.Message(
        content="This message has a couple of file element", elements=elements
    ).send()
