from typing import Optional

import chainlit as cl


@cl.set_starter_categories
async def starter_categories(user: Optional[cl.User] = None):
    return [
        cl.StarterCategory(
            label="Creative",
            icon="https://cdn-icons-png.flaticon.com/512/3094/3094837.png",
            starters=[
                cl.Starter(
                    label="Write a poem about nature",
                    message="Write a poem about nature",
                ),
                cl.Starter(
                    label="Create a short story",
                    message="Create a short story about adventure",
                ),
                cl.Starter(
                    label="Generate a creative name",
                    message="Generate creative names for a tech startup",
                ),
            ],
        ),
        cl.StarterCategory(
            label="Learning",
            icon="https://cdn-icons-png.flaticon.com/512/3976/3976625.png",
            starters=[
                cl.Starter(
                    label="Explain a complex topic",
                    message="Explain quantum computing in simple terms",
                ),
                cl.Starter(
                    label="Help me learn a language",
                    message="Teach me basic French phrases",
                ),
            ],
        ),
        cl.StarterCategory(
            label="Productivity",
            icon="https://cdn-icons-png.flaticon.com/512/1055/1055646.png",
            starters=[
                cl.Starter(
                    label="Summarize a topic",
                    message="Summarize the key points of machine learning",
                ),
                cl.Starter(
                    label="Create a plan", message="Help me create a weekly study plan"
                ),
            ],
        ),
    ]


@cl.on_message
async def on_message(msg: cl.Message):
    await cl.Message(f"You said: {msg.content}").send()
