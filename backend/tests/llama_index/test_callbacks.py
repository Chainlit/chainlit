from contextlib import asynccontextmanager
from unittest.mock import MagicMock, Mock, patch

import pytest
import pytest_asyncio
from chainlit.context import ChainlitContext, context_var

# Import the class we're testing
from chainlit.llama_index.callbacks import LlamaIndexCallbackHandler
from chainlit.session import WebsocketSession
from chainlit.step import Step
from chainlit.user_session import UserSession
from llama_index.core.callbacks.schema import CBEventType, EventPayload
from llama_index.core.tools.types import ToolMetadata


@asynccontextmanager
async def create_chainlit_context():
    mock_session = Mock(spec=WebsocketSession)
    mock_session.id = "test_session_id"
    mock_session.thread_id = "test_session_thread_id"
    mock_session.user_env = {"test_env": "value"}
    mock_session.chat_settings = {}
    mock_session.user = None
    mock_session.chat_profile = None
    mock_session.http_referer = None
    mock_session.client_type = "webapp"
    mock_session.languages = ["en"]

    context = ChainlitContext(mock_session)
    token = context_var.set(context)
    try:
        yield context
    finally:
        context_var.reset(token)


@pytest_asyncio.fixture
async def mock_chainlit_context():
    return create_chainlit_context()


async def test_on_event_start(mock_chainlit_context):
    TEST_EVENT_ID = "test_event_id"
    async with mock_chainlit_context as context:
        handler = LlamaIndexCallbackHandler()

        result = handler.on_event_start(
            CBEventType.FUNCTION_CALL,
            {
                EventPayload.TOOL: ToolMetadata(
                    name="test_tool", description="test_description"
                ),
                EventPayload.FUNCTION_CALL: {"arg1": "value1"},
            },
            TEST_EVENT_ID,
        )

        assert result == TEST_EVENT_ID
        assert TEST_EVENT_ID in handler.steps
        step = handler.steps[TEST_EVENT_ID]
        assert isinstance(step, Step)
        assert step.name == "test_tool"
        assert step.type == "tool"
        assert step.id == TEST_EVENT_ID
        assert step.input == '{\n    "arg1": "value1"\n}'
