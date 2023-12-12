import chainlit as cl

template = """Hello, this is a template.
This is a simple variable {variable1}
This is a another simple {variable2}
Those are two simple variables {variable1} + {variable2}
This is a formatting test {{variable1}} {{{variable2}}} {variable3}
This is another formatting test {{{{variable1}}}} {{{{{variable1}}}}}
This is a curly braces formatting test {{ {{{{ }} }}}}
"""

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
            template=template, inputs=inputs, completion=res
        )
    return res


@cl.on_chat_start
async def start():
    content = await gen_response()
    await cl.Message(
        content=content,
    ).send()
