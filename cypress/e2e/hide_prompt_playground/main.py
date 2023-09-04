from chainlit.prompt import Prompt

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


@cl.on_chat_start
async def start():
    await cl.Message(
        content="This is a message with a basic prompt",
        prompt=Prompt(
            template=template,
            inputs=inputs,
        ),
    ).send()
