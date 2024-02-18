from provider import ChatTestLLM, TestLLM

import chainlit as cl

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
            provider=TestLLM.id, completion=completion, prompt=formatted
        )
        step.output = "This is a message with only a formatted basic prompt"

    async with cl.Step() as step:
        step.generation = cl.ChatGeneration(
            provider=ChatTestLLM.id,
            completion=completion,
            inputs=inputs,
            messages=[
                cl.GenerationMessage(content=formatted, role="system"),
                cl.GenerationMessage(content=formatted, role="system"),
            ],
        )
        step.output = "This is a message with only a formatted chat prompt"
