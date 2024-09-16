from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock

import pytest
import pytest_asyncio
from chainlit.context import ChainlitContext, context_var
from chainlit.session import HTTPSession, WebsocketSession
from chainlit.user_session import UserSession


@asynccontextmanager
async def create_chainlit_context():
    mock_session = Mock(spec=WebsocketSession)
    mock_session.id = "test_session_id"
    mock_session.user_env = {"test_env": "value"}
    mock_session.chat_settings = {}
    mock_session.user = None
    mock_session.chat_profile = None
    mock_session.http_referer = None
    mock_session.client_type = "webapp"
    mock_session.languages = ["en"]
    mock_session.thread_id = "test_thread_id"
    mock_session.emit = AsyncMock()

    context = ChainlitContext(mock_session)
    token = context_var.set(context)
    try:
        yield context
    finally:
        context_var.reset(token)


@pytest_asyncio.fixture
async def mock_chainlit_context():
    return create_chainlit_context()


@pytest.fixture
def user_session():
    return UserSession()


@pytest.fixture
def mock_websocket_session():
    session = Mock(spec=WebsocketSession)
    session.emit = AsyncMock()

    return session


@pytest.fixture
def mock_http_session():
    return Mock(spec=HTTPSession)
