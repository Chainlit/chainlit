import os
from typing import Optional

import chainlit as cl
from chainlit.config import config

config.features.hot_swap_chat_profile = True
os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"  # nosec B105

starters = [
    cl.Starter(
        label="Say hi",
        message="Start a conversation with a greeting",
        icon="https://picsum.photos/300",
    ),
    cl.Starter(
        label="Ask for help",
        message="Ask for help with something",
        icon="https://picsum.photos/350",
    ),
]


@cl.set_chat_profiles
async def chat_profile(current_user: cl.User):
    if current_user.metadata.get("role") != "ADMIN":
        return None

    return [
        cl.ChatProfile(
            name="GPT-3.5",
            icon="https://picsum.photos/250",
            markdown_description="The underlying LLM model is **GPT-3.5**.",
            starters=starters,
        ),
        cl.ChatProfile(
            name="GPT-4",
            markdown_description="The underlying LLM model is **GPT-4**.",
            icon="https://picsum.photos/260",
            starters=starters,
        ),
        cl.ChatProfile(
            name="GPT-5",
            markdown_description="The underlying LLM model is **GPT-5**.",
            icon="https://picsum.photos/270",
            starters=starters,
        ),
    ]


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin", metadata={"role": "ADMIN"})
    return None


@cl.on_message
async def on_message(message: cl.Message):
    user = cl.user_session.get("user")
    user_id = user.identifier if user else "anonymous"
    current_profile = cl.user_session.get("chat_profile")
    await cl.Message(
        content=f"Echo: {message.content} (profile: {current_profile}, user: {user_id})"
    ).send()
