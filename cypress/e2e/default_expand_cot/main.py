import chainlit as cl


@cl.step(name="Tool 3", type="tool")
async def tool_3():
    return "Response from tool 3"


@cl.step(name="Tool 2", type="tool")
async def tool_2():
    await tool_3()
    return "Response from tool 2"


@cl.step(name="Tool 1", type="tool")
async def tool_1():
    await tool_2()
    return "Response from tool 1"


@cl.on_message
async def main(message: cl.Message):
    await tool_1()

    await cl.Message(
        content="Final response",
    ).send()
