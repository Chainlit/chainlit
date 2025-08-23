import pytest
from pydantic import ValidationError

from chainlit.config import McpServerConfig


class TestMcpServerConfig:
    """Test cases for MCP server configuration validation."""

    def test_valid_stdio_config(self):
        """Test valid stdio server configuration."""
        config = McpServerConfig(
            name="test-stdio",
            client="stdio",
            command="npx my-mcp-server",
            auto_connect=True,
            timeout=30
        )
        assert config.name == "test-stdio"
        assert config.client == "stdio"
        assert config.command == "npx my-mcp-server"
        assert config.auto_connect is True
        assert config.timeout == 30

    def test_valid_sse_config(self):
        """Test valid SSE server configuration."""
        config = McpServerConfig(
            name="test-sse",
            client="sse",
            url="http://localhost:3001/sse",
            auto_connect=True,
            timeout=45,
            headers={"Authorization": "Bearer token"}
        )
        assert config.name == "test-sse"
        assert config.client == "sse"
        assert config.url == "http://localhost:3001/sse"
        assert config.headers == {"Authorization": "Bearer token"}

    def test_valid_streamable_http_config(self):
        """Test valid streamable-http server configuration."""
        config = McpServerConfig(
            name="test-http",
            client="streamable-http",
            url="http://localhost:3001/mcp",
            auto_connect=False,
            timeout=60
        )
        assert config.name == "test-http"
        assert config.client == "streamable-http"
        assert config.url == "http://localhost:3001/mcp"
        assert config.auto_connect is False

    def test_stdio_missing_command(self):
        """Test stdio configuration missing required command."""
        with pytest.raises(ValueError, match="'command' is required for client type 'stdio'"):
            McpServerConfig(
                name="test-stdio",
                client="stdio",
                auto_connect=True
            )

    def test_sse_missing_url(self):
        """Test SSE configuration missing required URL."""
        with pytest.raises(ValueError, match="'url' is required for client type 'sse'"):
            McpServerConfig(
                name="test-sse",
                client="sse",
                auto_connect=True
            )

    def test_streamable_http_missing_url(self):
        """Test streamable-http configuration missing required URL."""
        with pytest.raises(ValueError, match="'url' is required for client type 'streamable-http'"):
            McpServerConfig(
                name="test-http",
                client="streamable-http",
                auto_connect=True
            )

    def test_invalid_timeout_zero(self):
        """Test configuration with zero timeout."""
        with pytest.raises(ValueError, match="'timeout' must be positive"):
            McpServerConfig(
                name="test-stdio",
                client="stdio",
                command="npx my-mcp-server",
                timeout=0
            )

    def test_invalid_timeout_negative(self):
        """Test configuration with negative timeout."""
        with pytest.raises(ValueError, match="'timeout' must be positive"):
            McpServerConfig(
                name="test-stdio",
                client="stdio",
                command="npx my-mcp-server",
                timeout=-10
            )

    def test_invalid_client_type(self):
        """Test configuration with invalid client type."""
        with pytest.raises(ValidationError):
            McpServerConfig(
                name="test-invalid",
                client="invalid-client",
                auto_connect=True
            )

    def test_defaults(self):
        """Test default values are applied correctly."""
        config = McpServerConfig(
            name="test-default",
            client="stdio",
            command="npx test-server"
        )
        assert config.auto_connect is True  # Default
        assert config.timeout == 30  # Default
        assert config.url is None  # Default
        assert config.headers is None  # Default

    def test_optional_fields_can_be_none(self):
        """Test that optional fields can be None."""
        config = McpServerConfig(
            name="test-optional",
            client="stdio",
            command="npx test-server",
            timeout=None,
            headers=None
        )
        assert config.timeout is None
        assert config.headers is None

    def test_stdio_with_url_ignored(self):
        """Test that URL is ignored for stdio client."""
        config = McpServerConfig(
            name="test-stdio-url",
            client="stdio",
            command="npx test-server",
            url="http://localhost:3000"  # Should be ignored
        )
        assert config.command == "npx test-server"
        assert config.url == "http://localhost:3000"  # Present but not validated for stdio

    def test_http_with_command_ignored(self):
        """Test that command is ignored for HTTP clients."""
        config = McpServerConfig(
            name="test-http-command",
            client="streamable-http",
            url="http://localhost:3001/mcp",
            command="npx test-server"  # Should be ignored
        )
        assert config.url == "http://localhost:3001/mcp"
        assert config.command == "npx test-server"  # Present but not validated for HTTP


class TestMcpFeature:
    """Test cases for MCP feature configuration."""

    def test_empty_servers_list(self):
        """Test MCP feature with empty servers list."""
        from chainlit.config import McpFeature
        
        feature = McpFeature(enabled=True, servers=[])
        assert feature.enabled is True
        assert feature.servers == []

    def test_none_servers_list(self):
        """Test MCP feature with None servers list."""
        from chainlit.config import McpFeature
        
        feature = McpFeature(enabled=True, servers=None)
        assert feature.enabled is True
        assert feature.servers is None

    def test_multiple_servers(self):
        """Test MCP feature with multiple servers."""
        from chainlit.config import McpFeature
        
        servers = [
            McpServerConfig(
                name="server1",
                client="stdio",
                command="npx server1"
            ),
            McpServerConfig(
                name="server2",
                client="sse",
                url="http://localhost:3001/sse"
            )
        ]
        
        feature = McpFeature(enabled=True, servers=servers)
        assert len(feature.servers) == 2
        assert feature.servers[0].name == "server1"
        assert feature.servers[1].name == "server2"