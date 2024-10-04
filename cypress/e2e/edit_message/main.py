import chainlit as cl


@cl.on_message
async def main():
    await cl.Message(
        content=f"Chat context length: {len(cl.chat_context.get())}"
    ).send()
