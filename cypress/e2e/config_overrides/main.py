import os
from typing import Optional

import chainlit as cl
from chainlit.config import (
    ChainlitConfigOverrides,
    FeaturesSettings,
    McpFeature,
    UISettings,
)

os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"  # nosec B105

starters = [
    cl.Starter(
        label="Default Chat",
        message="Start a conversation with default settings",
        icon="https://picsum.photos/350",
    ),
    cl.Starter(
        label="MCP Test",
        message="Test MCP functionality",
        icon="a-arrow-down",
    ),
]


@cl.set_chat_profiles
async def chat_profile(current_user: cl.User):
    if current_user.metadata["role"] != "ADMIN":
        return None

    return [
        cl.ChatProfile(
            name="Default Profile",
            icon="https://picsum.photos/250",
            markdown_description="Standard profile without MCP features. This profile uses **default settings** without any special configurations.",
            starters=starters,
        ),
        cl.ChatProfile(
            name="MCP Enabled",
            markdown_description="Profile with **MCP features enabled**. This profile has *Model Context Protocol* support activated. [Learn more](https://example.com/mcp)",
            icon="https://picsum.photos/250",
            starters=starters,
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
            markdown_description="Profile with **MCP explicitly disabled**. This ensures no MCP functionality is available.",
            icon="https://picsum.photos/200",
            starters=starters,
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
        content=f"starting chat with {user.identifier} using the {chat_profile} chat profile"
    ).send()
