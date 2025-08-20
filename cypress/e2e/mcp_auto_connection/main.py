import asyncio
import json
from typing import Optional

import chainlit as cl
from chainlit.config import ChainlitConfigOverrides, FeaturesSettings, McpFeature, McpServerConfig


# Mock MCP server that responds with a simple message
class MockMCPServer:
    def __init__(self, name: str, delay: float = 0.1):
        self.name = name
        self.delay = delay
        self.connection_count = 0

    async def handle_connection(self):
        """Simulate MCP server connection handling"""
        await asyncio.sleep(self.delay)
        self.connection_count += 1
        return f"Connected to {self.name} (connection #{self.connection_count})"


# Global mock servers for testing
mock_servers = {
    "test-server-1": MockMCPServer("test-server-1", 0.1),
    "test-server-2": MockMCPServer("test-server-2", 0.2),
    "disabled-server": MockMCPServer("disabled-server", 0.1),
}


@cl.set_chat_profiles
async def chat_profile():
    return [
        cl.ChatProfile(
            name="MCP Auto-Connect Enabled",
            icon="🔌",
            markdown_description="Profile that tests **MCP auto-connection** feature with multiple servers configured.",
            config_overrides=ChainlitConfigOverrides(
                features=FeaturesSettings(
                    mcp=McpFeature(
                        enabled=True,
                        servers=[
                            McpServerConfig(
                                name="test-server-1",
                                client="stdio",
                                command="echo 'mock mcp server 1'",
                                auto_connect=True,
                                timeout=30,
                            ),
                            McpServerConfig(
                                name="test-server-2", 
                                client="stdio",
                                command="echo 'mock mcp server 2'",
                                auto_connect=True,
                                timeout=30,
                            ),
                            McpServerConfig(
                                name="disabled-server",
                                client="stdio", 
                                command="echo 'disabled mock server'",
                                auto_connect=False,  # Should NOT auto-connect
                                timeout=30,
                            ),
                        ],
                    )
                )
            ),
        ),
        cl.ChatProfile(
            name="MCP Auto-Connect Disabled",
            icon="🔌",
            markdown_description="Profile with **MCP feature disabled** to test that auto-connection is skipped.",
            config_overrides=ChainlitConfigOverrides(
                features=FeaturesSettings(mcp=McpFeature(enabled=False))
            ),
        ),
        cl.ChatProfile(
            name="MCP No Servers",
            icon="🔌",
            markdown_description="Profile with **MCP enabled but no servers** configured.",
            config_overrides=ChainlitConfigOverrides(
                features=FeaturesSettings(
                    mcp=McpFeature(
                        enabled=True,
                        servers=[],  # Empty servers list
                    )
                )
            ),
        ),
    ]


@cl.on_chat_start
async def on_chat_start():
    """Handle chat start and report MCP auto-connection results."""
    chat_profile = cl.user_session.get("chat_profile")
    
    # Get the current session's MCP connections (if any)
    session = cl.user_session.get()
    mcp_sessions = getattr(session, 'mcp_sessions', {})
    
    # Create status message based on profile and connections
    if chat_profile == "MCP Auto-Connect Enabled":
        if mcp_sessions:
            connected_servers = list(mcp_sessions.keys())
            content = f"""🔌 **MCP Auto-Connection Test Results**

**Profile:** {chat_profile}
**Connected Servers:** {len(connected_servers)} 
**Server Names:** {', '.join(connected_servers)}

✅ **Expected:** test-server-1, test-server-2 should auto-connect
❌ **Expected:** disabled-server should NOT auto-connect

**Status:** {"✅ SUCCESS" if set(connected_servers) == {"test-server-1", "test-server-2"} else "❌ FAILED"}
"""
        else:
            content = f"""🔌 **MCP Auto-Connection Test Results**

**Profile:** {chat_profile}  
**Connected Servers:** 0
**Status:** ❌ FAILED - Expected auto-connections but none found
"""
            
    elif chat_profile == "MCP Auto-Connect Disabled":
        content = f"""🔌 **MCP Auto-Connection Test Results**

**Profile:** {chat_profile}
**Connected Servers:** {len(mcp_sessions)}
**Status:** {"✅ SUCCESS" if len(mcp_sessions) == 0 else "❌ FAILED"} - MCP disabled, no connections expected
"""

    elif chat_profile == "MCP No Servers":
        content = f"""🔌 **MCP Auto-Connection Test Results**

**Profile:** {chat_profile}
**Connected Servers:** {len(mcp_sessions)}
**Status:** {"✅ SUCCESS" if len(mcp_sessions) == 0 else "❌ FAILED"} - No servers configured, no connections expected
"""
    else:
        content = f"🔌 **MCP Auto-Connection Test Results**\n\n**Profile:** {chat_profile}\n**Status:** Unknown profile"

    await cl.Message(content=content).send()


@cl.on_message
async def on_message(message: cl.Message):
    """Handle user messages and provide MCP connection info."""
    session = cl.user_session.get()
    mcp_sessions = getattr(session, 'mcp_sessions', {})
    
    if message.content.lower() in ["status", "mcp", "connections"]:
        if mcp_sessions:
            server_list = []
            for name, (session_obj, _) in mcp_sessions.items():
                status = "Connected" if session_obj else "Failed"
                server_list.append(f"• **{name}:** {status}")
            
            content = f"""📊 **Current MCP Connections**

{chr(10).join(server_list)}

**Total:** {len(mcp_sessions)} server(s)
"""
        else:
            content = "📊 **Current MCP Connections**\n\n❌ No MCP servers connected"
            
        await cl.Message(content=content).send()
    else:
        await cl.Message(
            content=f"Echo: {message.content}\n\n💡 Try sending 'status' to see current MCP connections."
        ).send()