import chainlit as cl


@cl.on_chat_start
async def main():
    await cl.Message("Hello, this is a test message!").send()


@cl.step(type="tool")
async def tool():
    await cl.sleep(5)
    return "Response from the tool!"


@cl.on_message
async def on_message(message: cl.Message):
    if message.content == "tool":
        await tool()
    else:
        await cl.sleep(5)
        await cl.Message(f"Received message: {message.content}").send()
