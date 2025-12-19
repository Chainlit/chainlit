"""Test app for LLM picker e2e tests."""

import chainlit as cl


@cl.set_llms
async def set_llms(user, language):
    """Provide LLMs for the picker."""
    return [
        {
            "id": "gemini_3_pro_high",
            "name": "Gemini 3 Pro",
            "description": "Most capable and intelligent",
            "icon": "sparkles",
            "default": False,
        },
        {
            "id": "gemini_3_pro_low",
            "name": "Gemini 3 Pro (Low)",
            "description": "Balanced performance",
            "icon": "zap",
            "default": False,
        },
        {
            "id": "gemini_3_flash",
            "name": "Gemini 3 Flash",
            "description": "Quick and efficient",
            "icon": "bolt",
            "default": True,
        },
    ]


@cl.on_message
async def on_message(message: cl.Message):
    """Echo the message with the selected LLM."""
    selected_llm = message.llm or "No LLM selected"
    await cl.Message(
        content=f"You selected: {selected_llm}\n\nYour message: {message.content}"
    ).send()
