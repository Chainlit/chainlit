import pytest
import pytest_asyncio
from unittest.mock import Mock
from contextlib import asynccontextmanager
from chainlit.user_session import UserSession
from chainlit.context import ChainlitContext, context_var
from chainlit.session import WebsocketSession


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


async def test_user_session_set_get(mock_chainlit_context, user_session):
    async with mock_chainlit_context as context:
        # Test setting a value
        user_session.set("test_key", "test_value")

        # Test getting the value
        assert user_session.get("test_key") == "test_value"

        # Test getting a default value for a non-existent key
        assert user_session.get("non_existent_key", "default") == "default"

        # Test getting session-related values
        assert user_session.get("id") == context.session.id
        assert user_session.get("env") == context.session.user_env
        assert user_session.get("languages") == context.session.languages
