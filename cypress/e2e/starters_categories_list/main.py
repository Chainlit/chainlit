from typing import Optional

import chainlit as cl


@cl.set_starter_categories
async def starter_categories(user: Optional[cl.User] = None):
    return [
        cl.StarterCategory(
            label="Creative",
            starters=[
                cl.Starter(label="poem", message="Write a poem"),
                cl.Starter(label="story", message="Write a story"),
            ],
        ),
        cl.StarterCategory(
            label="Educational",
            starters=[
                cl.Starter(label="explain", message="Explain something"),
            ],
        ),
    ]


@cl.on_message
async def on_message(msg: cl.Message):
    await cl.Message(msg.content).send()
