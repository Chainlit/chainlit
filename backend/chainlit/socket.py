import asyncio
import json
from http.cookies import SimpleCookie
from typing import Any, Dict

from chainlit.action import Action
from chainlit.client.base import MessageDict
from chainlit.client.cloud import CloudAuthClient
from chainlit.client.utils import get_auth_client, get_db_client
from chainlit.config import config
from chainlit.context import init_context
from chainlit.emitter import ChainlitEmitter
from chainlit.logger import logger
from chainlit.message import ErrorMessage, Message
from chainlit.server import socket
from chainlit.session import Session
from chainlit.telemetry import trace_event
from chainlit.types import FileSpec
from chainlit.user_session import user_sessions


def load_chainlit_initial_headers(http_cookie):
    cookie = SimpleCookie(http_cookie)
    cookie_string = ""
    initial_headers = cookie.get("chainlit-initial-headers")
    if initial_headers:
        cookie_string = initial_headers.value
    if cookie_string:
        try:
            chainlit_initial_headers = json.loads(cookie_string)
        except ValueError:
            chainlit_initial_headers = {}
    else:
        chainlit_initial_headers = {}

    return chainlit_initial_headers


def restore_existing_session(sid, session_id, emit_fn, ask_user_fn):
    """Restore a session from the sessionId provided by the client."""
    if session := Session.get_by_id(session_id):
        session.restore(new_socket_id=sid)
        session.emit = emit_fn
        session.ask_user = ask_user_fn
        trace_event("session_restored")
        return True
    return False


def load_user_env(user_env):
    # Check user env
    if config.project.user_env:
        # Check if requested user environment variables are provided
        if user_env:
            user_env = json.loads(user_env)
            for key in config.project.user_env:
                if key not in user_env:
                    trace_event("missing_user_env")
                    raise ConnectionRefusedError(
                        "Missing user environment variable: " + key
                    )
        else:
            raise ConnectionRefusedError("Missing user environment variables")
    return user_env


@socket.on("connect")
async def connect(sid, environ, auth):
    # Function to send a message to this particular session
    def emit_fn(event, data):
        if session := Session.get(sid):
            if session.should_stop:
                session.should_stop = False
                raise InterruptedError("Task stopped by user")
        return socket.emit(event, data, to=sid)

    # Function to ask the user a question
    def ask_user_fn(data, timeout):
        if session := Session.get(sid):
            if session.should_stop:
                session.should_stop = False
                raise InterruptedError("Task stopped by user")
        return socket.call("ask", data, timeout=timeout, to=sid)

    session_id = environ.get("HTTP_X_CHAINLIT_SESSION_ID")
    if restore_existing_session(sid, session_id, emit_fn, ask_user_fn):
        return True

    request_headers = load_chainlit_initial_headers(environ.get("HTTP_COOKIE"))

    db_client = None
    user_env = environ.get("HTTP_USER_ENV")

    try:
        auth_client = await get_auth_client(
            handshake_headers=environ, request_headers=request_headers
        )
        if config.project.database:
            db_client = await get_db_client(
                handshake_headers=environ,
                request_headers=request_headers,
                user_infos=auth_client.user_infos,
            )
        user_env = load_user_env(user_env)
    except ConnectionRefusedError as e:
        logger.error(f"ConnectionRefusedError: {e}")
        return False

    Session(
        id=session_id,
        socket_id=sid,
        emit=emit_fn,
        ask_user=ask_user_fn,
        auth_client=auth_client,
        db_client=db_client,
        user_env=user_env,
        initial_headers=request_headers,
    )

    trace_event("connection_successful")
    return True


@socket.on("connection_successful")
async def connection_successful(sid):
    context = init_context(sid)
    if context.session.restored:
        return

    if isinstance(
        context.session.auth_client, CloudAuthClient
    ) and config.project.database in [
        "local",
        "custom",
    ]:
        await context.session.db_client.create_user(
            context.session.auth_client.user_infos
        )

    if config.code.on_file_upload:
        await context.emitter.enable_file_upload(config.code.on_file_upload_config)

    if config.code.on_chat_start:
        """Call the on_chat_start function provided by the developer."""
        await config.code.on_chat_start()


@socket.on("clear_session")
async def clean_session(sid):
    if session := Session.get(sid):
        # Clean up the user session
        if session.id in user_sessions:
            user_sessions.pop(session.id)
        # Clean up the session
        session.delete()


@socket.on("disconnect")
async def disconnect(sid):
    async def disconnect_on_timeout(sid):
        await asyncio.sleep(config.project.session_timeout)
        if session := Session.get(sid):
            # Clean up the user session
            if session.id in user_sessions:
                user_sessions.pop(session.id)
            # Clean up the session
            session.delete()

    asyncio.ensure_future(disconnect_on_timeout(sid))


@socket.on("stop")
async def stop(sid):
    if session := Session.get(sid):
        trace_event("stop_task")

        context = init_context(session)
        await Message(author="System", content="Task stopped by the user.").send()

        session.should_stop = True

        if config.code.on_stop:
            await config.code.on_stop()


async def process_message(session: Session, message_dict: MessageDict):
    """Process a message from the user."""
    try:
        context = init_context(session)

        await context.emitter.task_start()
        await context.emitter.process_user_message(message_dict)

        message = Message.from_dict(message_dict)
        if config.code.on_message:
            await config.code.on_message(message.content.strip(), message.id)
    except InterruptedError:
        pass
    except Exception as e:
        logger.exception(e)
        await ErrorMessage(
            author="Error", content=str(e) or e.__class__.__name__
        ).send()
    finally:
        await context.emitter.task_end()


@socket.on("ui_message")
async def message(sid, message):
    """Handle a message sent by the User."""
    session = Session.require(sid)
    session.should_stop = False

    await process_message(session, message)


async def process_action(action: Action):
    callback = config.code.action_callbacks.get(action.name)
    if callback:
        await callback(action)
    else:
        logger.warning("No callback found for action %s", action.name)


@socket.on("action_call")
async def call_action(sid, action):
    """Handle an action call from the UI."""
    init_context(sid)

    action = Action(**action)

    await process_action(action)


@socket.on("chat_settings_change")
async def change_settings(sid, settings: Dict[str, Any]):
    """Handle change settings submit from the UI."""
    context = init_context(sid)

    for key, value in settings.items():
        context.session.chat_settings[key] = value

    if config.code.on_settings_update:
        await config.code.on_settings_update(settings)


@socket.on("file_upload")
async def file_upload(sid, files: Any):
    """Handle file upload from the UI."""
    init_context(sid)

    if config.code.on_file_upload:
        await config.code.on_file_upload(files)
