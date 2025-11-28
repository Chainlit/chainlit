import sys
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from chainlit.mcp import (
    HttpMcpConnection,
    SseMcpConnection,
    StdioMcpConnection,
    validate_mcp_command,
)


class TestStdioMcpConnection:
    """Test suite for StdioMcpConnection model."""

    def test_stdio_connection_initialization(self):
        """Test StdioMcpConnection initialization."""
        connection = StdioMcpConnection(
            name="test_server", command="python", args=["-m", "mcp_server"]
        )

        assert connection.name == "test_server"
        assert connection.command == "python"
        assert connection.args == ["-m", "mcp_server"]
        assert connection.clientType == "stdio"

    def test_stdio_connection_with_empty_args(self):
        """Test StdioMcpConnection with empty args list."""
        connection = StdioMcpConnection(name="test_server", command="node", args=[])

        assert connection.args == []
        assert connection.clientType == "stdio"

    def test_stdio_connection_requires_name(self):
        """Test that StdioMcpConnection requires name."""
        with pytest.raises(ValidationError):
            StdioMcpConnection(command="python", args=[])

    def test_stdio_connection_requires_command(self):
        """Test that StdioMcpConnection requires command."""
        with pytest.raises(ValidationError):
            StdioMcpConnection(name="test_server", args=[])

    def test_stdio_connection_requires_args(self):
        """Test that StdioMcpConnection requires args."""
        with pytest.raises(ValidationError):
            StdioMcpConnection(name="test_server", command="python")

    def test_stdio_connection_client_type_is_literal(self):
        """Test that clientType is always 'stdio'."""
        connection = StdioMcpConnection(name="test_server", command="python", args=[])

        assert connection.clientType == "stdio"

    def test_stdio_connection_serialization(self):
        """Test StdioMcpConnection serialization."""
        connection = StdioMcpConnection(
            name="test_server", command="python", args=["-m", "server"]
        )

        data = connection.model_dump()

        assert data["name"] == "test_server"
        assert data["command"] == "python"
        assert data["args"] == ["-m", "server"]
        assert data["clientType"] == "stdio"


class TestSseMcpConnection:
    """Test suite for SseMcpConnection model."""

    def test_sse_connection_initialization(self):
        """Test SseMcpConnection initialization."""
        connection = SseMcpConnection(name="test_server", url="https://example.com/mcp")

        assert connection.name == "test_server"
        assert connection.url == "https://example.com/mcp"
        assert connection.headers is None
        assert connection.clientType == "sse"

    def test_sse_connection_with_headers(self):
        """Test SseMcpConnection with headers."""
        headers = {"Authorization": "Bearer token123", "X-Custom": "value"}
        connection = SseMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        assert connection.headers == headers

    def test_sse_connection_requires_name(self):
        """Test that SseMcpConnection requires name."""
        with pytest.raises(ValidationError):
            SseMcpConnection(url="https://example.com/mcp")

    def test_sse_connection_requires_url(self):
        """Test that SseMcpConnection requires url."""
        with pytest.raises(ValidationError):
            SseMcpConnection(name="test_server")

    def test_sse_connection_client_type_is_literal(self):
        """Test that clientType is always 'sse'."""
        connection = SseMcpConnection(name="test_server", url="https://example.com/mcp")

        assert connection.clientType == "sse"

    def test_sse_connection_serialization(self):
        """Test SseMcpConnection serialization."""
        headers = {"Authorization": "Bearer token"}
        connection = SseMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        data = connection.model_dump()

        assert data["name"] == "test_server"
        assert data["url"] == "https://example.com/mcp"
        assert data["headers"] == headers
        assert data["clientType"] == "sse"


class TestHttpMcpConnection:
    """Test suite for HttpMcpConnection model."""

    def test_http_connection_initialization(self):
        """Test HttpMcpConnection initialization."""
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp"
        )

        assert connection.name == "test_server"
        assert connection.url == "https://example.com/mcp"
        assert connection.headers is None
        assert connection.clientType == "streamable-http"

    def test_http_connection_with_headers(self):
        """Test HttpMcpConnection with headers."""
        headers = {
            "Authorization": "Bearer token123",
            "Content-Type": "application/json",
        }
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        assert connection.headers == headers

    def test_http_connection_requires_name(self):
        """Test that HttpMcpConnection requires name."""
        with pytest.raises(ValidationError):
            HttpMcpConnection(url="https://example.com/mcp")

    def test_http_connection_requires_url(self):
        """Test that HttpMcpConnection requires url."""
        with pytest.raises(ValidationError):
            HttpMcpConnection(name="test_server")

    def test_http_connection_client_type_is_literal(self):
        """Test that clientType is always 'streamable-http'."""
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp"
        )

        assert connection.clientType == "streamable-http"

    def test_http_connection_serialization(self):
        """Test HttpMcpConnection serialization."""
        headers = {"Authorization": "Bearer token"}
        connection = HttpMcpConnection(
            name="test_server", url="https://example.com/mcp", headers=headers
        )

        data = connection.model_dump()

        assert data["name"] == "test_server"
        assert data["url"] == "https://example.com/mcp"
        assert data["headers"] == headers
        assert data["clientType"] == "streamable-http"


class TestValidateMcpCommand:
    """Test suite for validate_mcp_command function."""

    def test_validate_simple_command(self):
        """Test validation of a simple command."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python", "node"]

            env, executable, args = validate_mcp_command("python -m mcp_server")

            assert env == {}
            assert executable == "python"
            assert args == ["-m", "mcp_server"]

    def test_validate_command_with_path(self):
        """Test validation of command with full path."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            env, executable, args = validate_mcp_command(
                "/usr/bin/python -m mcp_server"
            )

            assert env == {}
            assert executable == "/usr/bin/python"
            assert args == ["-m", "mcp_server"]

    def test_validate_command_with_windows_path(self):
        """Test validation of command with Windows path (using forward slashes or quoted)."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python.exe"]

            # Use forward slashes which work on Windows and don't get escaped by shlex
            env, executable, args = validate_mcp_command(
                "C:/Python/python.exe -m mcp_server"
            )

            assert env == {}
            assert executable == "C:/Python/python.exe"
            assert args == ["-m", "mcp_server"]

    def test_validate_command_with_env_vars(self):
        """Test validation of command with environment variables."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["node"]

            env, executable, args = validate_mcp_command(
                "MY_VAR=value NODE_ENV=production node server.js"
            )

            assert env == {"MY_VAR": "value", "NODE_ENV": "production"}
            assert executable == "node"
            assert args == ["server.js"]

    def test_validate_command_with_env_var_with_spaces(self):
        """Test validation of command with env var containing spaces."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            env, executable, args = validate_mcp_command(
                'MY_VAR="value with spaces" python script.py'
            )

            assert env == {"MY_VAR": "value with spaces"}
            assert executable == "python"
            assert args == ["script.py"]

    def test_validate_command_with_quoted_args(self):
        """Test validation of command with quoted arguments."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            env, executable, args = validate_mcp_command(
                'python script.py --arg "value with spaces"'
            )

            assert env == {}
            assert executable == "python"
            assert args == ["script.py", "--arg", "value with spaces"]

    def test_validate_command_with_multiple_args(self):
        """Test validation of command with multiple arguments."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["node"]

            env, executable, args = validate_mcp_command(
                "node server.js --port 3000 --host localhost"
            )

            assert env == {}
            assert executable == "node"
            assert args == ["server.js", "--port", "3000", "--host", "localhost"]

    def test_validate_command_not_in_allowed_list(self):
        """Test that validation fails for disallowed executable."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python", "node"]

            with pytest.raises(ValueError, match="Only commands in"):
                validate_mcp_command("bash script.sh")

    def test_validate_empty_command(self):
        """Test that validation fails for empty command."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            with pytest.raises(ValueError, match="Empty command string"):
                validate_mcp_command("")

    def test_validate_command_with_invalid_syntax(self):
        """Test that validation fails for invalid command syntax."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            with pytest.raises(ValueError, match="Invalid command string"):
                validate_mcp_command('python "unclosed quote')

    def test_validate_command_with_none_allowed_executables(self):
        """Test validation when allowed_executables is None (all allowed)."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = None

            env, executable, args = validate_mcp_command("any_command --arg value")

            assert env == {}
            assert executable == "any_command"
            assert args == ["--arg", "value"]

    def test_validate_command_with_invalid_env_var_format(self):
        """Test that validation fails for invalid env var format."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            with pytest.raises(ValueError, match="Invalid environment variable format"):
                validate_mcp_command("INVALID_ENV python script.py")

    def test_validate_command_with_complex_env_vars(self):
        """Test validation with complex environment variables."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            env, executable, args = validate_mcp_command(
                'API_KEY=sk-123456 BASE_URL="https://api.example.com" python app.py'
            )

            assert env == {
                "API_KEY": "sk-123456",
                "BASE_URL": "https://api.example.com",
            }
            assert executable == "python"
            assert args == ["app.py"]

    def test_validate_command_with_equals_in_arg(self):
        """Test validation with equals sign in argument."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            env, executable, args = validate_mcp_command(
                "python script.py --config=value"
            )

            assert env == {}
            assert executable == "python"
            assert args == ["script.py", "--config=value"]

    def test_validate_command_preserves_arg_order(self):
        """Test that argument order is preserved."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["node"]

            _, _, args = validate_mcp_command(
                "node app.js arg1 arg2 arg3 --flag1 --flag2"
            )

            assert args == ["app.js", "arg1", "arg2", "arg3", "--flag1", "--flag2"]


class TestMcpConnectionEdgeCases:
    """Test suite for MCP connection edge cases."""

    def test_stdio_connection_with_complex_args(self):
        """Test StdioMcpConnection with complex arguments."""
        connection = StdioMcpConnection(
            name="complex_server",
            command="python",
            args=[
                "-m",
                "mcp_server",
                "--config",
                "/path/to/config.json",
                "--verbose",
            ],
        )

        assert len(connection.args) == 5
        assert connection.args[0] == "-m"
        assert connection.args[3] == "/path/to/config.json"

    def test_sse_connection_with_multiple_headers(self):
        """Test SseMcpConnection with multiple headers."""
        headers = {
            "Authorization": "Bearer token",
            "X-API-Key": "key123",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        connection = SseMcpConnection(
            name="multi_header_server", url="https://api.example.com", headers=headers
        )

        assert len(connection.headers) == 4
        assert connection.headers["Authorization"] == "Bearer token"
        assert connection.headers["X-API-Key"] == "key123"

    def test_http_connection_with_localhost_url(self):
        """Test HttpMcpConnection with localhost URL."""
        connection = HttpMcpConnection(
            name="local_server", url="http://localhost:8000/mcp"
        )

        assert connection.url == "http://localhost:8000/mcp"

    def test_connection_names_can_be_descriptive(self):
        """Test that connection names can be descriptive strings."""
        stdio_conn = StdioMcpConnection(
            name="My Custom MCP Server (Python)", command="python", args=[]
        )
        sse_conn = SseMcpConnection(
            name="Production API Server", url="https://api.example.com"
        )
        http_conn = HttpMcpConnection(
            name="Development Server - Local", url="http://localhost:3000"
        )

        assert "Python" in stdio_conn.name
        assert "Production" in sse_conn.name
        assert "Development" in http_conn.name

    def test_validate_command_with_special_characters_in_path(self):
        """Test validation with special characters in path."""
        mcp_module = sys.modules["chainlit.mcp"]
        with patch.object(mcp_module, "config") as mock_config:
            mock_config.features.mcp.stdio.allowed_executables = ["python"]

            _, executable, args = validate_mcp_command(
                "/opt/my-app/bin/python script.py"
            )

            assert executable == "/opt/my-app/bin/python"
            assert args == ["script.py"]
