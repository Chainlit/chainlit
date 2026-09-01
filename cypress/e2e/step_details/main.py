import chainlit as cl


@cl.step(type="tool", name="leaf")
async def leaf():
    return "Leaf result"


@cl.step(type="tool", name="branch")
async def branch():
    await leaf()
    return "Branch result"


@cl.step(type="tool", name="root")
async def root():
    await branch()
    return "Root result"


@cl.on_message
async def main(message: cl.Message):
    await root()
    await cl.Message(content="Final answer").send()
