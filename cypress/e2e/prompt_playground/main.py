from provider import ChatTestLLM, TestLLM

import chainlit as cl
from chainlit.prompt import Prompt, PromptMessage

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
    await cl.Message(
        content="This is a message with a basic prompt",
        prompt=Prompt(
            provider=TestLLM.id,
            completion=completion,
            template=template,
            inputs=inputs,
        ),
    ).send()

    await cl.Message(
        content="This is a message with only a formatted basic prompt",
        prompt=Prompt(provider=TestLLM.id, completion=completion, formatted=formatted),
    ).send()

    await cl.Message(
        content="This is a message with a chat prompt",
        prompt=Prompt(
            provider=ChatTestLLM.id,
            completion=completion,
            template=template,
            inputs=inputs,
            messages=[
                PromptMessage(template=template, role="system"),
                PromptMessage(template=template, role="system"),
            ],
        ),
    ).send()

    await cl.Message(
        content="This is a message with only a formatted chat prompt",
        prompt=Prompt(
            provider=ChatTestLLM.id,
            completion=completion,
            template=template,
            inputs=inputs,
            messages=[
                PromptMessage(formatted=formatted, role="system"),
                PromptMessage(formatted=formatted, role="system"),
            ],
        ),
    ).send()
