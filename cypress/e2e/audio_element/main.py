import os

import chainlit as cl

# Get the directory where the script is located
script_directory = os.path.dirname(os.path.abspath(__file__))
# Create absolute path to the audio file
audio_path = os.path.join(script_directory, "../../fixtures/example.mp3")


@cl.on_chat_start
async def start():
    elements = [cl.Audio(name="example.mp3", path=audio_path)]

    await cl.Message(content="This message has an audio", elements=elements).send()
