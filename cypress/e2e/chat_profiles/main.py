from typing import Optional

import chainlit as cl


@cl.set_chat_profiles
async def chat_profile(current_user: cl.AppUser):
    if current_user.role != "ADMIN":
        return None

    return [
        cl.ChatProfile(
            name="GPT-3.5",
            markdown_description="The underlying LLM model is **GPT-3.5**, a *175B parameter model* trained on 410GB of text data.",
        ),
        cl.ChatProfile(
            name="GPT-4",
            markdown_description="The underlying LLM model is **GPT-4**, a *1.5T parameter model* trained on 3.5TB of text data.",
            icon="https://picsum.photos/250",
        ),
        cl.ChatProfile(
            name="GPT-5",
            markdown_description="The underlying LLM model is **GPT-5**.",
            icon="https://picsum.photos/200",
        ),
    ]


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.AppUser]:
    if (username, password) == ("admin", "admin"):
        return cl.AppUser(username="admin", role="ADMIN", provider="credentials")
    else:
        return None


# @cl.on_message
# async def on_message(message: str):
#     await cl.Message(content=f"echo: {message}").send()


@cl.on_chat_start
async def on_chat_start():
    app_user = cl.user_session.get("user")
    chat_profile = cl.user_session.get("chat_profile")
    await cl.Message(
        content=f"starting chat with {app_user.username} using the {chat_profile} chat profile"
    ).send()
