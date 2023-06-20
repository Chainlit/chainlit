import chainlit as cl


@cl.on_chat_start
async def start():
    await cl.Message(
        content="""Hello!

```python
import chainlit as cl

@cl.on_chat_start
async def main():
    await cl.Message(
        content="Here is a simple message",
    ).send()
```"""
    ).send()
