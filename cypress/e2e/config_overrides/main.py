from typing import Optional

import chainlit as cl
from chainlit.config import (
    ChainlitConfigOverrides,
    UISettings,
    FeaturesSettings,
    McpFeature,
)


@cl.set_chat_profiles
async def chat_profile(current_user: cl.User):
    if current_user.metadata["role"] != "ADMIN":
        return None

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


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin", metadata={"role": "ADMIN"})
    else:
        return None


@cl.on_message
async def on_message():
    user = cl.user_session.get("user")
    chat_profile = cl.user_session.get("chat_profile")
    await cl.Message(
        content=f"Chat with {user.identifier} using {chat_profile} profile"
    ).send()
