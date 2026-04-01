import json
import tempfile
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

import pytest

from chainlit.session import (
    BaseSession,
    HTTPSession,
    JSONEncoderIgnoreNonSerializable,
    WebsocketSession,
    clean_metadata,
)


class TestJSONEncoderIgnoreNonSerializable:
    """Test suite for JSONEncoderIgnoreNonSerializable."""

    def test_encoder_handles_serializable_objects(self):
        """Test that encoder handles normal serializable objects."""
        data = {
            "string": "value",
            "number": 42,
            "list": [1, 2, 3],
            "dict": {"key": "value"},
        }
        result = json.dumps(data, cls=JSONEncoderIgnoreNonSerializable)
        assert json.loads(result) == data

    def test_encoder_ignores_non_serializable_objects(self):
        """Test that encoder returns None for non-serializable objects."""

        class NonSerializable:
            pass

        data = {"normal": "value", "non_serializable": NonSerializable()}
        result = json.dumps(data, cls=JSONEncoderIgnoreNonSerializable)
        parsed = json.loads(result)

        assert parsed["normal"] == "value"
        assert parsed["non_serializable"] is None

    def test_encoder_with_nested_non_serializable(self):
        """Test encoder with nested non-serializable objects."""

        class NonSerializable:
            pass

        data = {
            "level1": {
                "level2": {
                    "serializable": "value",
                    "non_serializable": NonSerializable(),
                }
            }
        }
        result = json.dumps(data, cls=JSONEncoderIgnoreNonSerializable)
        parsed = json.loads(result)

        assert parsed["level1"]["level2"]["serializable"] == "value"
        assert parsed["level1"]["level2"]["non_serializable"] is None


class TestCleanMetadata:
    """Test suite for clean_metadata function."""

    def test_clean_metadata_with_normal_data(self):
        """Test clean_metadata with normal serializable data."""
        metadata = {"key": "value", "number": 42, "list": [1, 2, 3]}
        result = clean_metadata(metadata)
        assert result == metadata

    def test_clean_metadata_removes_non_serializable(self):
        """Test that clean_metadata removes non-serializable objects."""

        class NonSerializable:
            pass

        metadata = {"normal": "value", "non_serializable": NonSerializable()}
        result = clean_metadata(metadata)

        assert result["normal"] == "value"
        assert result["non_serializable"] is None

    def test_clean_metadata_redacts_large_data(self):
        """Test that clean_metadata redacts data exceeding max size."""
        # Create large metadata
        large_data = {"data": "x" * 2000000}  # > 1MB
        result = clean_metadata(large_data, max_size=1048576)

        assert "message" in result
        assert "exceeds the limit" in result["message"]

    def test_clean_metadata_with_custom_max_size(self):
        """Test clean_metadata with custom max size."""
        small_data = {"data": "x" * 100}
        result = clean_metadata(small_data, max_size=50)

        # Should be redacted because it exceeds 50 bytes
        assert "message" in result
        assert "exceeds the limit" in result["message"]

    def test_clean_metadata_preserves_unicode(self):
        """Test that clean_metadata preserves Unicode characters."""
        metadata = {"chinese": "你好", "emoji": "🎉", "japanese": "こんにちは"}
        result = clean_metadata(metadata)

        assert result["chinese"] == "你好"
        assert result["emoji"] == "🎉"
        assert result["japanese"] == "こんにちは"


class TestBaseSession:
    """Test suite for BaseSession class."""

    def test_base_session_initialization(self):
        """Test BaseSession initialization with required parameters."""
        session = BaseSession(
            id="test_id",
            client_type="webapp",
            thread_id=None,
            user=None,
            token=None,
            user_env=None,
        )

        assert session.id == "test_id"
        assert session.client_type == "webapp"
        assert session.thread_id is not None  # Auto-generated UUID
        assert session.user is None
        assert session.token is None
        assert session.user_env == {}
        assert session.chat_settings == {}

    def test_base_session_with_thread_id(self):
        """Test BaseSession with provided thread_id."""
        thread_id = str(uuid.uuid4())
        session = BaseSession(
            id="test_id",
            client_type="webapp",
            thread_id=thread_id,
            user=None,
            token=None,
            user_env=None,
        )

        assert session.thread_id == thread_id
        assert session.thread_id_to_resume == thread_id

    def test_base_session_with_user_env(self):
        """Test BaseSession with user environment variables."""
        user_env = {"API_KEY": "secret", "ENV_VAR": "value"}
        session = BaseSession(
            id="test_id",
            client_type="webapp",
            thread_id=None,
            user=None,
            token=None,
            user_env=user_env,
        )

        assert session.user_env == user_env

    def test_base_session_with_chat_profile(self):
        """Test BaseSession with chat profile."""
        session = BaseSession(
            id="test_id",
            client_type="webapp",
            thread_id=None,
            user=None,
            token=None,
            user_env=None,
            chat_profile="gpt-4",
        )

        assert session.chat_profile == "gpt-4"

    def test_base_session_files_dir(self):
        """Test BaseSession files_dir property."""
        with patch("chainlit.config.FILES_DIRECTORY", Path("/tmp/files")):
            session = BaseSession(
                id="test_id",
                client_type="webapp",
                thread_id=None,
                user=None,
                token=None,
                user_env=None,
            )

            assert session.files_dir == Path("/tmp/files/test_id")

    @pytest.mark.asyncio
    async def test_base_session_persist_file_with_content(self):
        """Test persisting a file with content."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("chainlit.config.FILES_DIRECTORY", Path(tmpdir)):
                session = BaseSession(
                    id="test_id",
                    client_type="webapp",
                    thread_id=None,
                    user=None,
                    token=None,
                    user_env=None,
                )

                content = b"test file content"
                result = await session.persist_file(
                    name="test.txt",
                    mime="text/plain",
                    content=content,
                )

                assert "id" in result
                assert result["id"] in session.files
                assert session.files[result["id"]]["name"] == "test.txt"
                assert session.files[result["id"]]["type"] == "text/plain"

    @pytest.mark.asyncio
    async def test_base_session_persist_file_with_string_content(self):
        """Test persisting a file with string content."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("chainlit.config.FILES_DIRECTORY", Path(tmpdir)):
                session = BaseSession(
                    id="test_id",
                    client_type="webapp",
                    thread_id=None,
                    user=None,
                    token=None,
                    user_env=None,
                )

                content = "test string content"
                result = await session.persist_file(
                    name="test.txt",
                    mime="text/plain",
                    content=content,
                )

                assert "id" in result
                file_id = result["id"]
                assert session.files[file_id]["size"] > 0

    @pytest.mark.asyncio
    async def test_base_session_persist_file_without_path_or_content(self):
        """Test that persist_file raises error without path or content."""
        session = BaseSession(
            id="test_id",
            client_type="webapp",
            thread_id=None,
            user=None,
            token=None,
            user_env=None,
        )

        with pytest.raises(ValueError, match="Either path or content must be provided"):
            await session.persist_file(name="test.txt", mime="text/plain")

    def test_base_session_to_persistable(self):
        """Test BaseSession to_persistable method."""
        from chainlit.user_session import user_sessions

        original_sessions = user_sessions.copy()
        user_sessions.update({"test_id": {"key": "value"}})

        try:
            with patch("chainlit.config.config") as mock_config:
                mock_config.project.persist_user_env = True

                session = BaseSession(
                    id="test_id",
                    client_type="webapp",
                    thread_id=None,
                    user=None,
                    token=None,
                    user_env={"API_KEY": "secret"},
                    chat_profile="gpt-4",
                )
                session.chat_settings = {"temperature": 0.7}

                result = session.to_persistable()

                assert result["chat_settings"] == {"temperature": 0.7}
                assert result["chat_profile"] == "gpt-4"
                assert result["client_type"] == "webapp"
        finally:
            user_sessions.clear()
            user_sessions.update(original_sessions)

    def test_base_session_to_persistable_without_persist_user_env(self):
        """Test to_persistable removes user_env when persist_user_env is False."""
        from chainlit.user_session import user_sessions

        original_sessions = user_sessions.copy()
        user_sessions.update({"test_id": {"env": {"KEY": "value"}}})

        try:
            with patch("chainlit.config.config") as mock_config:
                mock_config.project.persist_user_env = False

                session = BaseSession(
                    id="test_id",
                    client_type="webapp",
                    thread_id=None,
                    user=None,
                    token=None,
                    user_env={"API_KEY": "secret"},
                )

                result = session.to_persistable()

                assert result["env"] == {}
        finally:
            user_sessions.clear()
            user_sessions.update(original_sessions)


class TestHTTPSession:
    """Test suite for HTTPSession class."""

    def test_http_session_initialization(self):
        """Test HTTPSession initialization."""
        session = HTTPSession(
            id="http_id",
            client_type="copilot",
            thread_id=None,
            user=None,
            token=None,
            user_env=None,
        )

        assert session.id == "http_id"
        assert session.client_type == "copilot"
        assert isinstance(session, BaseSession)

    @pytest.mark.asyncio
    async def test_http_session_delete(self):
        """Test HTTPSession delete method."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("chainlit.config.FILES_DIRECTORY", Path(tmpdir)):
                session = HTTPSession(
                    id="http_id",
                    client_type="copilot",
                )

                # Create files directory
                session.files_dir.mkdir(exist_ok=True)
                test_file = session.files_dir / "test.txt"
                test_file.write_text("test")

                assert session.files_dir.exists()

                await session.delete()

                assert not session.files_dir.exists()


class TestWebsocketSession:
    """Test suite for WebsocketSession class."""

    def test_websocket_session_initialization(self):
        """Test WebsocketSession initialization."""
        emit_mock = Mock()
        emit_call_mock = Mock()

        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=emit_mock,
            emit_call=emit_call_mock,
            user_env={},
            client_type="webapp",
        )

        assert session.id == "ws_id"
        assert session.socket_id == "socket_123"
        assert session.emit == emit_mock
        assert session.emit_call == emit_call_mock
        assert session.restored is False
        assert session.mcp_sessions == {}

    def test_websocket_session_language_detection(self):
        """Test WebsocketSession language detection from HTTP headers."""
        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
            environ={"HTTP_ACCEPT_LANGUAGE": "fr-FR,fr;q=0.9,en;q=0.8"},
        )

        assert session.language == "fr-FR"

    def test_websocket_session_default_language(self):
        """Test WebsocketSession defaults to en-US without language header."""
        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
            environ={},
        )

        assert session.language == "en-US"

    def test_websocket_session_restore(self):
        """Test WebsocketSession restore method."""
        from chainlit.session import ws_sessions_sid

        session = WebsocketSession(
            id="ws_id",
            socket_id="old_socket",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
        )

        assert ws_sessions_sid.get("old_socket") == session

        session.restore("new_socket")

        assert session.socket_id == "new_socket"
        assert session.restored is True
        assert ws_sessions_sid.get("old_socket") is None
        assert ws_sessions_sid.get("new_socket") == session

    @pytest.mark.asyncio
    async def test_websocket_session_delete(self):
        """Test WebsocketSession delete method."""
        from chainlit.session import ws_sessions_id, ws_sessions_sid

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("chainlit.config.FILES_DIRECTORY", Path(tmpdir)):
                session = WebsocketSession(
                    id="ws_id",
                    socket_id="socket_123",
                    emit=Mock(),
                    emit_call=Mock(),
                    user_env={},
                    client_type="webapp",
                )

                # Create files directory
                session.files_dir.mkdir(exist_ok=True)

                assert ws_sessions_sid.get("socket_123") == session
                assert ws_sessions_id.get("ws_id") == session

                await session.delete()

                assert not session.files_dir.exists()
                assert ws_sessions_sid.get("socket_123") is None
                assert ws_sessions_id.get("ws_id") is None

    def test_websocket_session_get(self):
        """Test WebsocketSession.get class method."""
        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
        )

        retrieved = WebsocketSession.get("socket_123")
        assert retrieved == session

    def test_websocket_session_get_by_id(self):
        """Test WebsocketSession.get_by_id class method."""
        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
        )

        retrieved = WebsocketSession.get_by_id("ws_id")
        assert retrieved == session

    def test_websocket_session_require_success(self):
        """Test WebsocketSession.require with existing session."""
        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
        )

        retrieved = WebsocketSession.require("socket_123")
        assert retrieved == session

    def test_websocket_session_require_failure(self):
        """Test WebsocketSession.require raises error for missing session."""
        with pytest.raises(ValueError, match="Session not found"):
            WebsocketSession.require("nonexistent_socket")

    @pytest.mark.asyncio
    async def test_websocket_session_flush_method_queue(self):
        """Test WebsocketSession flush_method_queue."""
        from collections import deque

        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
        )

        # Create a mock async method
        mock_method = AsyncMock()

        # Add items to queue
        session.thread_queues["test_method"] = deque(
            [
                (mock_method, session, ("arg1",), {"kwarg1": "value1"}),
                (mock_method, session, ("arg2",), {"kwarg2": "value2"}),
            ]
        )

        await session.flush_method_queue()

        assert mock_method.call_count == 2
        assert len(session.thread_queues["test_method"]) == 0


class TestSessionEdgeCases:
    """Test suite for session edge cases."""

    def test_base_session_with_all_client_types(self):
        """Test BaseSession with different client types."""
        client_types = ["webapp", "copilot", "teams", "slack", "discord"]

        for client_type in client_types:
            session = BaseSession(
                id=f"test_{client_type}",
                client_type=client_type,
                thread_id=None,
                user=None,
                token=None,
                user_env=None,
            )
            assert session.client_type == client_type

    @pytest.mark.asyncio
    async def test_persist_file_with_mime_extension(self):
        """Test that persist_file adds correct file extension based on MIME type."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("chainlit.config.FILES_DIRECTORY", Path(tmpdir)):
                session = BaseSession(
                    id="test_id",
                    client_type="webapp",
                    thread_id=None,
                    user=None,
                    token=None,
                    user_env=None,
                )

                # Test with image MIME type
                result = await session.persist_file(
                    name="image.png",
                    mime="image/png",
                    content=b"fake image data",
                )

                file_id = result["id"]
                file_path = session.files[file_id]["path"]
                assert file_path.suffix == ".png"

    def test_clean_metadata_with_empty_dict(self):
        """Test clean_metadata with empty dictionary."""
        result = clean_metadata({})
        assert result == {}

    def test_websocket_session_with_chat_profile(self):
        """Test WebsocketSession with chat profile."""
        session = WebsocketSession(
            id="ws_id",
            socket_id="socket_123",
            emit=Mock(),
            emit_call=Mock(),
            user_env={},
            client_type="webapp",
            chat_profile="gpt-4",
        )

        assert session.chat_profile == "gpt-4"

    @pytest.mark.asyncio
    async def test_websocket_session_delete_with_mcp_sessions(self):
        """Test WebsocketSession delete with MCP sessions."""

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("chainlit.config.FILES_DIRECTORY", Path(tmpdir)):
                session = WebsocketSession(
                    id="ws_id",
                    socket_id="socket_123",
                    emit=Mock(),
                    emit_call=Mock(),
                    user_env={},
                    client_type="webapp",
                )

                # Mock MCP session with exit stack
                mock_exit_stack = AsyncMock()
                session.mcp_sessions["mcp1"] = (Mock(), mock_exit_stack)

                await session.delete()

                mock_exit_stack.aclose.assert_called_once()
