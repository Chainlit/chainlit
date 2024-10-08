import datetime
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock

import pytest
import pytest_asyncio
from chainlit.context import ChainlitContext, context_var
from chainlit.session import HTTPSession, WebsocketSession
from chainlit.user import PersistedUser
from chainlit.user_session import UserSession


@pytest.fixture
def persisted_test_user():
    return PersistedUser(
        id="test_user_id",
        createdAt=datetime.datetime.now().isoformat(),
        identifier="test_user_identifier",
    )


@pytest.fixture
def mock_session():
    mock = Mock(spec=WebsocketSession)
    mock.id = "test_session_id"
    mock.user_env = {"test_env": "value"}
    mock.chat_settings = {}
    mock.chat_profile = None
    mock.http_referer = None
    mock.client_type = "webapp"
    mock.languages = ["en"]
    mock.thread_id = "test_thread_id"
    mock.emit = AsyncMock()
    mock.has_first_interaction = True

    return mock


@asynccontextmanager
async def create_chainlit_context(mock_session):
    context = ChainlitContext(mock_session)
    token = context_var.set(context)
    try:
        yield context
    finally:
        context_var.reset(token)


@pytest_asyncio.fixture
async def mock_chainlit_context(persisted_test_user, mock_session):
    mock_session.user = persisted_test_user
    return create_chainlit_context(mock_session)


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
