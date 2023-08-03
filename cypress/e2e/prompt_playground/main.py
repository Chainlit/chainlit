import chainlit as cl
from chainlit.types import Prompt, PromptMessage
from provider import TestLLM, ChatTestLLM

template = """Hello, this is a template.
This is a variable1 {variable1}
And this is variable2 {variable2}
And this is variable1 + variable2 {variable1} + {variable2}
"""

formatted = "This is a test formatted prompt"

inputs = {
    "variable1": "variable1 value",
    "variable2": "variable2 value",
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
            messages=[PromptMessage(template=template, role="system")],
        ),
    ).send()

    await cl.Message(
        content="This is a message with only a formatted chat prompt",
        prompt=Prompt(
            provider=ChatTestLLM.id,
            completion=completion,
            template=template,
            inputs=inputs,
            messages=[PromptMessage(formatted=formatted, role="system")],
        ),
    ).send()
