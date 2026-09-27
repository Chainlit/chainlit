import chainlit as cl


@cl.step(type="tool", name="tool1")
async def tool1():
    return "Result from tool1"


@cl.step(type="tool", name="tool2")
async def tool2():
    return "Result from tool2"


@cl.step(type="tool", name="tool3")
async def tool3():
    return "Result from tool3"


@cl.step(type="tool", name="tool_icon", icon="search")
async def tool_icon():
    return "Result from tool_icon"


@cl.step(type="tool", name="agent")
async def agent():
    # Two tools nested under an intermediate step. Compact mode must count the
    # nested steps recursively (not just top-level ones) to activate.
    await tool1()
    await tool2()
    return "Result from agent"


@cl.step(type="tool", name="answering-agent")
async def answering_agent():
    await tool1()
    await tool2()
    # Assistant message emitted from inside a nested step.
    await cl.Message(content="Nested answer").send()


@cl.on_message
async def main(message: cl.Message):
    content = message.content.strip().lower()

    if content == "single":
        # A single visible step must not be collapsed into a compact summary.
        await tool1()
    elif content == "nested":
        # Only one top-level step, but it nests two tools -> 3 visible steps.
        await agent()
    elif content == "nested_message":
        # An assistant message produced inside a nested step must still render
        # at the root, not be trapped inside the collapsed compact summary.
        await answering_agent()
        return
    elif content == "icon":
        # The last visible step carries an icon, so the compact summary avatar
        # must render that icon instead of a fallback avatar image.
        await tool1()
        await tool2()
        await tool_icon()
    else:
        # Three sequential tools -> collapsed into one compact summary.
        await tool1()
        await tool2()
        await tool3()

    await cl.Message(content="Final answer").send()
