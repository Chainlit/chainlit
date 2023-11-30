import chainlit as cl


def tool_3():
    with cl.Step(name="Tool 3", type="TOOL") as s:
        cl.run_sync(cl.sleep(2))
        s.output = "Response from tool 3"


@cl.step
def tool_2():
    tool_3()
    cl.run_sync(cl.Message(content="Message from tool 2").send())
    return "Response from tool 2"


@cl.step(name="Tool 1", type="TOOL")
def tool_1():
    tool_2()
    return "Response from tool 1"


@cl.on_message
async def main(message: cl.Message):
    tool_1()
