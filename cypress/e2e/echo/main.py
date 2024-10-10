import chainlit as cl


@cl.on_message
async def main(message: cl.Message):
    """Example from 'In Pure Python' docs section."""
    # Your custom logic goes here...

    # Send a response back to the user
    await cl.Message(
        content=f"Received: {message.content}",
    ).send()
