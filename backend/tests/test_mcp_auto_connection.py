import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from chainlit.config import McpServerConfig
import chainlit.mcp_connection
from chainlit.mcp_connection import auto_connect_mcp_servers, _connect_single_server


@pytest.fixture
def mock_config():
    """Mock configuration with MCP servers."""
    config = MagicMock()
    config.features.mcp.enabled = True
    config.features.mcp.servers = [
        McpServerConfig(
            name="test-stdio",
            client="stdio",
            command="npx test-server",
            auto_connect=True,
            timeout=30
        ),
        McpServerConfig(
            name="test-http",
            client="streamable-http", 
            url="http://localhost:3001/mcp",
            auto_connect=True,
            timeout=30
        ),
        McpServerConfig(
            name="test-disabled",
            client="sse",
            url="http://localhost:3002/sse",
            auto_connect=False,  # Should not auto-connect
            timeout=30
        )
    ]
    config.features.mcp.sse.enabled = True
    config.features.mcp.streamable_http.enabled = True
    config.features.mcp.stdio.enabled = True
    config.code.on_mcp_connect = AsyncMock()
    return config


@pytest.fixture
def mock_session():
    """Mock session with MCP sessions dictionary."""
    session = MagicMock()
    session.mcp_sessions = {}
    return session


@pytest.fixture
def mock_context(mock_session):
    """Mock context with session."""
    context = MagicMock()
    context.session = mock_session
    return context


@pytest.mark.asyncio
class TestAutoConnectMcpServers:
    """Test cases for auto-connecting MCP servers."""

    async def test_auto_connect_enabled_servers(self, mock_config, mock_context):
        """Test that only auto_connect=True servers are connected."""
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context), \
             patch('chainlit.mcp_connection._connect_single_server') as mock_connect:
            
            mock_connect.return_value = None
            
            await auto_connect_mcp_servers()
            
            # Should call connect for 2 servers (auto_connect=True), not the disabled one
            assert mock_connect.call_count == 2
            
            # Check the servers that were called
            called_servers = [call[0][0] for call in mock_connect.call_args_list]
            server_names = [server.name for server in called_servers]
            assert "test-stdio" in server_names
            assert "test-http" in server_names
            assert "test-disabled" not in server_names

    async def test_mcp_disabled(self, mock_config, mock_context):
        """Test that auto-connection is skipped when MCP is disabled."""
        mock_config.features.mcp.enabled = False
        
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context):
            
            await auto_connect_mcp_servers()
            
            # Should not attempt any connections
            assert len(mock_context.session.mcp_sessions) == 0

    async def test_no_servers_configured(self, mock_config, mock_context):
        """Test that auto-connection handles empty server list."""
        mock_config.features.mcp.servers = []
        
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context):
            
            await auto_connect_mcp_servers()
            
            # Should not attempt any connections
            assert len(mock_context.session.mcp_sessions) == 0

    async def test_no_session_available(self, mock_config):
        """Test that auto-connection handles missing session gracefully."""
        mock_context_no_session = MagicMock()
        mock_context_no_session.session = None
        
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context_no_session):
            
            # Should not raise an exception
            await auto_connect_mcp_servers()

    async def test_connection_error_handling(self, mock_config, mock_context):
        """Test that connection errors are handled gracefully."""
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context), \
             patch('chainlit.mcp_connection._connect_single_server') as mock_connect:
            
            # Make one connection succeed and one fail
            async def side_effect(server_config):
                if server_config.name == "test-stdio":
                    raise Exception("Connection failed")
                # test-http will succeed (no exception)
            
            mock_connect.side_effect = side_effect
            
            # Should not raise an exception despite one connection failing
            await auto_connect_mcp_servers()
            
            # Should still attempt both connections
            assert mock_connect.call_count == 2


@pytest.mark.asyncio 
class TestConnectSingleServer:
    """Test cases for connecting to a single MCP server."""

    async def test_connection_timeout(self, mock_session):
        """Test that connection respects timeout."""
        mock_context_obj = MagicMock()
        mock_context_obj.session = mock_session
        
        server_config = McpServerConfig(
            name="test-timeout",
            client="stdio", 
            command="npx test-server",
            timeout=1  # 1 second timeout
        )
        
        # Make connection hang longer than timeout
        async def slow_connection(server_config):
            await asyncio.sleep(2)
        
        with patch.object(chainlit.mcp_connection, 'context', mock_context_obj), \
             patch('chainlit.mcp_connection._establish_connection') as mock_establish:
            
            mock_establish.side_effect = slow_connection
            
            with pytest.raises(RuntimeError, match="Connection timeout"):
                await _connect_single_server(server_config)

    async def test_no_session_available(self):
        """Test error when no session is available."""
        mock_context_obj = MagicMock()
        mock_context_obj.session = None
        
        server_config = McpServerConfig(
            name="test-no-session",
            client="stdio",
            command="npx test-server"
        )
        
        with patch.object(chainlit.mcp_connection, 'context', mock_context_obj):
            with pytest.raises(RuntimeError, match="No session available"):
                await _connect_single_server(server_config)

    async def test_already_connected_server(self, mock_session):
        """Test that already connected servers are skipped."""
        mock_context_obj = MagicMock()
        mock_context_obj.session = mock_session
        mock_session.mcp_sessions = {"test-existing": (MagicMock(), MagicMock())}
        
        server_config = McpServerConfig(
            name="test-existing",
            client="stdio",
            command="npx test-server"
        )
        
        with patch.object(chainlit.mcp_connection, 'context', mock_context_obj):
            # Should return without error and not modify existing connection
            await _connect_single_server(server_config)
            
            # Connection should remain unchanged
            assert "test-existing" in mock_session.mcp_sessions


@pytest.mark.asyncio
class TestEstablishConnection:
    """Test cases for establishing MCP connections."""
    
    async def test_stdio_connection(self, mock_config, mock_session):
        """Test establishing stdio connection."""
        from chainlit.mcp_connection import _establish_connection
        
        mock_context_obj = MagicMock()
        mock_context_obj.session = mock_session
        
        server_config = McpServerConfig(
            name="test-stdio",
            client="stdio",
            command="npx test-server"
        )
        
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context_obj), \
             patch('mcp.client.stdio.stdio_client') as mock_stdio_client, \
             patch('chainlit.mcp.validate_mcp_command') as mock_validate, \
             patch('mcp.ClientSession') as mock_client_session:
            
            mock_validate.return_value = ({}, "npx", ["test-server"])
            
            # Mock transport and session
            mock_transport = (AsyncMock(), AsyncMock())
            mock_stdio_client.return_value.__aenter__ = AsyncMock(return_value=mock_transport)
            mock_client_session.return_value.__aenter__ = AsyncMock(return_value=AsyncMock())
            
            await _establish_connection(server_config)
            
            # Should validate command and create stdio client
            mock_validate.assert_called_once_with("npx test-server")
            mock_stdio_client.assert_called_once()

    async def test_unsupported_client_type(self, mock_config, mock_session):
        """Test error for unsupported client type.""" 
        from chainlit.mcp_connection import _establish_connection
        
        mock_context_obj = MagicMock()
        mock_context_obj.session = mock_session
        
        # Create config with invalid client type (this bypasses pydantic validation for testing)
        server_config = MagicMock()
        server_config.client = "invalid-client"
        server_config.name = "test-invalid"
        
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context_obj):
            
            with pytest.raises(ValueError, match="Unsupported client type"):
                await _establish_connection(server_config)

    async def test_client_type_disabled(self, mock_config, mock_session):
        """Test error when client type is disabled."""
        from chainlit.mcp_connection import _establish_connection
        
        mock_context_obj = MagicMock()
        mock_context_obj.session = mock_session
        
        mock_config.features.mcp.stdio.enabled = False  # Disable stdio
        
        server_config = McpServerConfig(
            name="test-disabled",
            client="stdio", 
            command="npx test-server"
        )
        
        with patch.object(chainlit.mcp_connection, 'config', mock_config), \
             patch.object(chainlit.mcp_connection, 'context', mock_context_obj):
            
            with pytest.raises(RuntimeError, match="Stdio MCP is not enabled"):
                await _establish_connection(server_config)