import chainlit as cl


def tool_3():
    with cl.Step(name="tool3", type="tool") as s:
        cl.run_sync(cl.sleep(2))
        s.output = "Response from tool 3"


@cl.step(name="tool2", type="tool")
def tool_2():
    tool_3()
    cl.run_sync(cl.Message(content="Message from tool 2").send())
    return "Response from tool 2"


@cl.step(name="tool1", type="tool")
def tool_1():
    tool_2()
    return "Response from tool 1"


@cl.on_message
async def main(message: cl.Message):
    tool_1()
