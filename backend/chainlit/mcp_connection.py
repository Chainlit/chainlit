import asyncio
from contextlib import AsyncExitStack
from typing import Dict, Tuple

from chainlit.config import McpServerConfig, config
from chainlit.context import context
from chainlit.logger import logger


async def auto_connect_mcp_servers() -> None:
    """Auto-connect to MCP servers defined in config.toml.
    
    This function connects to all MCP servers configured with auto_connect=True
    in the configuration file. It's designed to be called during chat initialization.
    """
    if not config.features.mcp.enabled:
        return
        
    if not config.features.mcp.servers:
        return
        
    session = context.session
    if not session:
        logger.warning("No session available for MCP auto-connection")
        return

    # Filter servers with auto_connect enabled
    servers_to_connect = [
        server for server in config.features.mcp.servers
        if server.auto_connect
    ]
    
    if not servers_to_connect:
        return
        
    logger.info(f"Auto-connecting to {len(servers_to_connect)} MCP servers")
    
    connection_tasks = []
    for server_config in servers_to_connect:
        task = asyncio.create_task(_connect_single_server(server_config))
        connection_tasks.append(task)
    
    # Wait for all connections with individual error handling
    results = await asyncio.gather(*connection_tasks, return_exceptions=True)
    
    successful_connections = 0
    for i, result in enumerate(results):
        server_name = servers_to_connect[i].name
        if isinstance(result, Exception):
            logger.error(f"Failed to auto-connect to MCP server '{server_name}': {result}")
        else:
            successful_connections += 1
            logger.info(f"Successfully auto-connected to MCP server '{server_name}'")
    
    logger.info(f"MCP auto-connection completed: {successful_connections}/{len(servers_to_connect)} successful")


async def _connect_single_server(server_config: McpServerConfig) -> None:
    """Connect to a single MCP server with timeout and error handling."""
    from mcp import ClientSession
    from mcp.client.sse import sse_client
    from mcp.client.stdio import (
        StdioServerParameters,
        get_default_environment,
        stdio_client,
    )
    from mcp.client.streamable_http import streamablehttp_client

    from chainlit.mcp import (
        HttpMcpConnection,
        McpConnection,
        SseMcpConnection,
        StdioMcpConnection,
        validate_mcp_command,
    )
    
    session = context.session
    if not session:
        raise RuntimeError("No session available")
    
    # Check if already connected
    if server_config.name in session.mcp_sessions:
        logger.debug(f"MCP server '{server_config.name}' is already connected, skipping")
        return
    
    # Apply connection timeout
    timeout = server_config.timeout or 30
    
    try:
        await asyncio.wait_for(_establish_connection(server_config), timeout=timeout)
    except asyncio.TimeoutError:
        raise RuntimeError(f"Connection timeout ({timeout}s) for server '{server_config.name}'")
    except Exception as e:
        raise RuntimeError(f"Connection failed for server '{server_config.name}': {str(e)}")


async def _establish_connection(server_config: McpServerConfig) -> None:
    """Establish the actual MCP connection."""
    from mcp import ClientSession
    from mcp.client.sse import sse_client
    from mcp.client.stdio import (
        StdioServerParameters,
        get_default_environment,
        stdio_client,
    )
    from mcp.client.streamable_http import streamablehttp_client

    from chainlit.mcp import (
        HttpMcpConnection,
        McpConnection,
        SseMcpConnection,
        StdioMcpConnection,
        validate_mcp_command,
    )
    
    session = context.session
    if not session:
        raise RuntimeError("No session available")
    
    exit_stack = AsyncExitStack()
    mcp_connection: McpConnection
    
    try:
        if server_config.client == "sse":
            if not config.features.mcp.sse.enabled:
                raise RuntimeError("SSE MCP is not enabled")
            
            mcp_connection = SseMcpConnection(
                url=server_config.url,
                name=server_config.name,
                headers=server_config.headers,
            )
            
            transport = await exit_stack.enter_async_context(
                sse_client(
                    url=mcp_connection.url,
                    headers=mcp_connection.headers,
                )
            )
            
        elif server_config.client == "stdio":
            if not config.features.mcp.stdio.enabled:
                raise RuntimeError("Stdio MCP is not enabled")
            
            env_from_cmd, command, args = validate_mcp_command(server_config.command)
            mcp_connection = StdioMcpConnection(
                command=command, args=args, name=server_config.name
            )
            
            transport = await exit_stack.enter_async_context(
                stdio_client(
                    StdioServerParameters(
                        command=command,
                        args=args,
                        env=get_default_environment() | env_from_cmd,
                    )
                )
            )
            
        elif server_config.client == "streamable-http":
            if not config.features.mcp.streamable_http.enabled:
                raise RuntimeError("HTTP MCP is not enabled")
            
            mcp_connection = HttpMcpConnection(
                url=server_config.url,
                name=server_config.name,
                headers=server_config.headers,
            )
            transport = await exit_stack.enter_async_context(
                streamablehttp_client(
                    url=mcp_connection.url,
                    headers=mcp_connection.headers,
                )
            )
            
        else:
            raise ValueError(f"Unsupported client type: {server_config.client}")
        
        # Create MCP session
        read, write = transport[:2]
        
        mcp_session: ClientSession = await exit_stack.enter_async_context(
            ClientSession(
                read_stream=read, write_stream=write, sampling_callback=None
            )
        )
        
        # Initialize the session
        await mcp_session.initialize()
        
        # Store the session
        session.mcp_sessions[mcp_connection.name] = (mcp_session, exit_stack)
        
        # Call the connection callback if it exists
        if config.code.on_mcp_connect:
            await config.code.on_mcp_connect(mcp_connection, mcp_session)
            
    except Exception:
        # Clean up on failure
        try:
            await exit_stack.aclose()
        except Exception:
            pass
        raise