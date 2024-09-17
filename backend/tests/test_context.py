from unittest.mock import Mock

import pytest
from chainlit.context import (
    ChainlitContext,
    ChainlitContextException,
    get_context,
    init_http_context,
    init_ws_context,
)
from chainlit.emitter import BaseChainlitEmitter, ChainlitEmitter
from chainlit.session import HTTPSession


@pytest.fixture
def mock_emitter():
    return Mock(spec=BaseChainlitEmitter)


async def test_chainlit_context_init_with_websocket(
    mock_websocket_session, mock_emitter
):
    context = ChainlitContext(mock_websocket_session, mock_emitter)
    assert isinstance(context.emitter, BaseChainlitEmitter)
    assert context.session == mock_websocket_session
    assert context.active_steps == []


async def test_chainlit_context_init_with_http(mock_http_session):
    context = ChainlitContext(mock_http_session)
    assert isinstance(context.emitter, BaseChainlitEmitter)
    assert context.session == mock_http_session
    assert context.active_steps == []


async def test_init_ws_context(mock_websocket_session):
    context = init_ws_context(mock_websocket_session)
    assert isinstance(context, ChainlitContext)
    assert context.session == mock_websocket_session
    assert isinstance(context.emitter, ChainlitEmitter)


async def test_init_http_context():
    context = init_http_context()
    assert isinstance(context, ChainlitContext)
    assert isinstance(context.session, HTTPSession)
    assert isinstance(context.emitter, BaseChainlitEmitter)


async def test_get_context():
    with pytest.raises(ChainlitContextException):
        get_context()

    init_http_context()  # Initialize a context
    context = get_context()
    assert isinstance(context, ChainlitContext)


async def test_current_step_and_run():
    context = init_http_context()
    assert context.current_step is None
    assert context.current_run is None

    # Mock a step
    mock_step = Mock()
    mock_step.name = "on_chat_start"
    context.active_steps.append(mock_step)

    assert context.current_step == mock_step
    assert context.current_run == mock_step
