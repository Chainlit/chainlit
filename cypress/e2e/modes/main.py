"""Test app for Modes picker e2e tests."""

import chainlit as cl


@cl.on_chat_start
async def start():
    """Set up modes for the picker."""
    await cl.context.emitter.set_modes(
        [
            cl.Mode(
                id="model",
                name="Model",
                options=[
                    cl.ModeOption(
                        id="gemini_3_pro",
                        name="Gemini 3 Pro",
                        description="Most capable and intelligent",
                        icon="sparkles",
                        default=False,
                    ),
                    cl.ModeOption(
                        id="gemini_3_flash",
                        name="Gemini 3 Flash",
                        description="Quick and efficient",
                        icon="bolt",
                        default=True,
                    ),
                ],
            ),
            cl.Mode(
                id="reasoning",
                name="Reasoning",
                options=[
                    cl.ModeOption(
                        id="high",
                        name="High",
                        description="Maximum depth analysis",
                        icon="flame",
                        default=False,
                    ),
                    cl.ModeOption(
                        id="medium",
                        name="Medium",
                        description="Balanced approach",
                        icon="scale",
                        default=True,
                    ),
                    cl.ModeOption(
                        id="low",
                        name="Low",
                        description="Quick responses",
                        icon="rocket",
                        default=False,
                    ),
                ],
            ),
        ]
    )


@cl.on_message
async def on_message(message: cl.Message):
    """Echo the message with the selected modes."""
    modes = message.modes or {}
    selected_model = modes.get("model", "No model selected")
    selected_reasoning = modes.get("reasoning", "No reasoning selected")
    await cl.Message(
        content=f"Model: {selected_model}\nReasoning: {selected_reasoning}\n\nYour message: {message.content}"
    ).send()
