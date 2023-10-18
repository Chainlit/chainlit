import chainlit as cl


@cl.on_message
async def main(message: cl.Message):
    await cl.Message(content=f"Content: {message.content}").send()
    # Check if message.elements is not empty and is a list
    for index, item in enumerate(message.elements):
        # Send a response for each element
        await cl.Message(content=f"Received element {index}: {item.name}").send()
