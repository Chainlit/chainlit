import chainlit as cl

template = """Hello, this is a template."""

inputs = {
    "variable1": "variable1 value",
    "variable2": "variable2 value",
    "variable3": "{{variable3 value}}",
}

completion = "This is the original completion"


@cl.step(type="llm")
async def gen_response():
    res = "This is a message with a basic prompt"
    if current_step := cl.context.current_step:
        current_step.generation = cl.CompletionGeneration(
            prompt=template, variables=inputs, completion=res
        )
    return res


@cl.on_chat_start
async def start():
    content = await gen_response()
    await cl.Message(
        content=content,
    ).send()
