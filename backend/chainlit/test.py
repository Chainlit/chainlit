from typing import Optional

import chainlit as cl
from chainlit.config import (
    ChainlitConfigOverrides,
    FeaturesSettings,
    McpFeature,
    UISettings,
)


@cl.set_chat_profiles
async def chat_profile(current_user: cl.User):
    return [
        cl.ChatProfile(
            name="Default Profile",
            markdown_description="Standard profile without MCP",
        ),
        cl.ChatProfile(
            name="MCP Enabled",
            markdown_description="Profile with MCP features enabled",
            config_overrides=ChainlitConfigOverrides(
                ui=UISettings(name="MCP UI"),
                features=FeaturesSettings(
                    mcp=McpFeature(
                        enabled=True,
                        stdio={"enabled": True},
                        sse={"enabled": True},
                        streamable_http={"enabled": True},
                    )
                ),
            ),
        ),
        cl.ChatProfile(
            name="MCP Disabled",
            markdown_description="Profile with MCP explicitly disabled",
            config_overrides=ChainlitConfigOverrides(
                features=FeaturesSettings(mcp=McpFeature(enabled=False))
            ),
        ),
    ]


@cl.on_message
async def on_message():
    chat_profile = cl.user_session.get("chat_profile")
    await cl.Message(
        content=f"Chat using {chat_profile} profile"
    ).send()
