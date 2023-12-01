from provider import ChatTestLLM, TestLLM

import chainlit as cl

template = """Hello, this is a template.
This is a simple variable {variable1}
This is a another simple {variable2}
Those are two simple variables {variable1} + {variable2}
This is a formatting test {{variable1}} {{{variable2}}} {variable3}
This is another formatting test {{{{variable1}}}} {{{{{variable1}}}}}
This is a curly braces formatting test {{ {{{{ }} }}}}
"""

formatted = "This is a test formatted prompt"

inputs = {
    "variable1": "variable1 value",
    "variable2": "variable2 value",
    "variable3": "{{variable3 value}}",
}

completion = "This is the original completion"


@cl.on_chat_start
async def start():
    async with cl.Step() as step:
        step.generation = cl.CompletionGeneration(
            provider=TestLLM.id, template=template, inputs=inputs, completion=completion
        )
        step.output = "This is a message with a basic prompt"

    async with cl.Step() as step:
        step.generation = cl.CompletionGeneration(
            provider=TestLLM.id, completion=completion, formatted=formatted
        )
        step.output = "This is a message with only a formatted basic prompt"

    async with cl.Step() as step:
        step.generation = cl.ChatGeneration(
            provider=ChatTestLLM.id,
            completion=completion,
            inputs=inputs,
            messages=[
                cl.GenerationMessage(template=template, role="system"),
                cl.GenerationMessage(template=template, role="system"),
            ],
        )
        step.output = "This is a message with a chat prompt"

    async with cl.Step() as step:
        step.generation = cl.ChatGeneration(
            provider=ChatTestLLM.id,
            completion=completion,
            inputs=inputs,
            messages=[
                cl.GenerationMessage(formatted=formatted, role="system"),
                cl.GenerationMessage(formatted=formatted, role="system"),
            ],
        )
        step.output = "This is a message with only a formatted chat prompt"
