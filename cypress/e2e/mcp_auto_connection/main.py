from typing import Optional

import chainlit as cl


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin", metadata={"role": "ADMIN"})
    else:
        return None


@cl.set_chat_profiles
async def chat_profile(current_user: cl.User):
    return [
        cl.ChatProfile(
            name="MCP Enabled Profile",
            icon="🔌",
            markdown_description="Profile with **MCP enabled** to test auto-connection feature availability.",
        ),
        cl.ChatProfile(
            name="Regular Profile",
            icon="💬",
            markdown_description="Standard profile **without MCP** configuration.",
        ),
    ]


@cl.on_chat_start
async def on_chat_start():
    """Handle chat start and report current configuration."""
    chat_profile = cl.user_session.get("chat_profile")

    # Get the current session's MCP connections (if any)
    session = cl.user_session.get()
    mcp_sessions = getattr(session, "mcp_sessions", {})

    # Create status message based on profile
    if chat_profile == "MCP Enabled Profile":
        content = f"""🔌 **MCP Auto-Connection Test**

**Profile:** {chat_profile}
**MCP Sessions Available:** {len(mcp_sessions)}

This profile tests the MCP auto-connection feature. In a real deployment with configured MCP servers in config.toml, servers with `auto_connect=true` would be automatically connected when this chat session starts.

**Configuration Example:**
```toml
[features.mcp]
enabled = true

[[features.mcp.servers]]
name = "my-server"
client = "stdio"
command = "npx my-mcp-server"
auto_connect = true
timeout = 30
```

**Status:** ✅ MCP UI available for testing
"""
    else:
        content = f"""💬 **Regular Chat Profile**

**Profile:** {chat_profile}
**MCP Sessions Available:** {len(mcp_sessions)}

This is a standard chat profile without special MCP configuration.

**Status:** ✅ Regular chat functionality
"""

    await cl.Message(content=content).send()


@cl.on_message
async def on_message(message: cl.Message):
    """Handle user messages and provide MCP connection info."""
    session = cl.user_session.get()
    mcp_sessions = getattr(session, "mcp_sessions", {})
    chat_profile = cl.user_session.get("chat_profile")

    if message.content.lower() in ["status", "mcp", "connections"]:
        if mcp_sessions:
            server_list = []
            for name, (session_obj, _) in mcp_sessions.items():
                status = "Connected" if session_obj else "Failed"
                server_list.append(f"• **{name}:** {status}")

            content = f"""📊 **Current MCP Connections**

{chr(10).join(server_list)}

**Total:** {len(mcp_sessions)} server(s)
**Profile:** {chat_profile}
"""
        else:
            content = f"""📊 **Current MCP Connections**

❌ No MCP servers connected
**Profile:** {chat_profile}

💡 To test auto-connection, configure MCP servers in your `config.toml` file with `auto_connect = true`.
"""

        await cl.Message(content=content).send()
    else:
        await cl.Message(
            content=f"Echo: {message.content}\n\n💡 Try sending 'status' to see current MCP connections.\n\n**Current Profile:** {chat_profile}"
        ).send()
