import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, Dict, Literal

from chainlit.action import Action
from chainlit.auth import get_current_user, require_login
from chainlit.config import config
from chainlit.context import init_ws_context
from chainlit.data import get_data_layer
from chainlit.logger import logger
from chainlit.message import ErrorMessage, Message
from chainlit.server import socket
from chainlit.session import WebsocketSession
from chainlit.telemetry import trace_event
from chainlit.types import UIMessagePayload
from chainlit.user_session import user_sessions


def restore_existing_session(sid, session_id, emit_fn, emit_call_fn):
    """Restore a session from the sessionId provided by the client."""
    if session := WebsocketSession.get_by_id(session_id):
        session.restore(new_socket_id=sid)
        session.emit = emit_fn
        session.emit_call = emit_call_fn
        trace_event("session_restored")
        return True
    return False


async def persist_user_session(thread_id: str, metadata: Dict):
    if data_layer := get_data_layer():
        await data_layer.update_thread(thread_id=thread_id, metadata=metadata)


async def resume_thread(session: WebsocketSession):
    data_layer = get_data_layer()
    if not data_layer or not session.user or not session.thread_id_to_resume:
        return
    thread = await data_layer.get_thread(thread_id=session.thread_id_to_resume)
    if not thread:
        return

    author = thread.get("user").get("identifier") if thread["user"] else None
    user_is_author = author == session.user.identifier

    if user_is_author:
        metadata = thread["metadata"] or {}
        user_sessions[session.id] = metadata.copy()
        if chat_profile := metadata.get("chat_profile"):
            session.chat_profile = chat_profile
        if chat_settings := metadata.get("chat_settings"):
            session.chat_settings = chat_settings

        trace_event("thread_resumed")

        return thread


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


def build_anon_user_identifier(environ):
    scope = environ.get("asgi.scope", {})
    client_ip, _ = scope.get("client")
    ip = environ.get("HTTP_X_FORWARDED_FOR", client_ip)

    try:
        headers = scope.get("headers", {})
        user_agent = next(
            (v.decode("utf-8") for k, v in headers if k.decode("utf-8") == "user-agent")
        )
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_agent + ip))

    except StopIteration:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, ip))


@socket.on("connect")
async def connect(sid, environ, auth):
    if not config.code.on_chat_start and not config.code.on_message:
        logger.warning(
            "You need to configure at least an on_chat_start or an on_message callback"
        )
        return False
    user = None
    anon_user_identifier = build_anon_user_identifier(environ)
    token = None
    login_required = require_login()
    try:
        # Check if the authentication is required
        if login_required:
            authorization_header = environ.get("HTTP_AUTHORIZATION")
            token = authorization_header.split(" ")[1] if authorization_header else None
            user = await get_current_user(token=token)
    except Exception as e:
        logger.info("Authentication failed")
        return False

    # Session scoped function to emit to the client
    def emit_fn(event, data):
        if session := WebsocketSession.get(sid):
            if session.should_stop:
                session.should_stop = False
                raise InterruptedError("Task stopped by user")
        return socket.emit(event, data, to=sid)

    # Session scoped function to emit to the client and wait for a response
    def emit_call_fn(event: Literal["ask", "call_fn"], data, timeout):
        if session := WebsocketSession.get(sid):
            if session.should_stop:
                session.should_stop = False
                raise InterruptedError("Task stopped by user")
        return socket.call(event, data, timeout=timeout, to=sid)

    session_id = environ.get("HTTP_X_CHAINLIT_SESSION_ID")
    if restore_existing_session(sid, session_id, emit_fn, emit_call_fn):
        return True

    user_env_string = environ.get("HTTP_USER_ENV")
    user_env = load_user_env(user_env_string)

    client_type = environ.get("HTTP_X_CHAINLIT_CLIENT_TYPE")

    ws_session = WebsocketSession(
        id=session_id,
        socket_id=sid,
        emit=emit_fn,
        emit_call=emit_call_fn,
        client_type=client_type,
        user_env=user_env,
        user=user,
        token=token,
        chat_profile=environ.get("HTTP_X_CHAINLIT_CHAT_PROFILE"),
        thread_id=environ.get("HTTP_X_CHAINLIT_THREAD_ID"),
    )

    if data_layer := get_data_layer():
        asyncio.create_task(
            data_layer.create_user_session(
                id=session_id,
                started_at=datetime.utcnow().isoformat(),
                anon_user_id=anon_user_identifier if not user else None,
                user_id=user.identifier if user else None,
            )
        )

    trace_event("connection_successful")
    return True


@socket.on("connection_successful")
async def connection_successful(sid):
    context = init_ws_context(sid)

    if context.session.restored:
        return

    await context.emitter.task_end()
    await context.emitter.clear("clear_ask")
    await context.emitter.clear("clear_call_fn")

    if context.session.thread_id_to_resume and config.code.on_chat_resume:
        thread = await resume_thread(context.session)
        if thread:
            context.session.has_first_interaction = True
            await context.emitter.emit("first_interaction", "resume")
            await context.emitter.resume_thread(thread)
            await config.code.on_chat_resume(thread)
            return

    if config.code.on_chat_start:
        await config.code.on_chat_start()


@socket.on("clear_session")
async def clean_session(sid):
    await disconnect(sid, force_clear=True)


@socket.on("disconnect")
async def disconnect(sid, force_clear=False):
    session = WebsocketSession.get(sid)
    if session:
        if data_layer := get_data_layer():
            asyncio.create_task(
                data_layer.update_user_session(
                    id=session.id,
                    is_interactive=session.has_first_interaction,
                    ended_at=datetime.utcnow().isoformat(),
                )
            )

        init_ws_context(session)

    if config.code.on_chat_end and session:
        await config.code.on_chat_end()

    if session and session.thread_id and session.has_first_interaction:
        await persist_user_session(session.thread_id, session.to_persistable())

    def clear():
        if session := WebsocketSession.get(sid):
            # Clean up the user session
            if session.id in user_sessions:
                user_sessions.pop(session.id)
            # Clean up the session
            session.delete()

    async def clear_on_timeout(sid):
        await asyncio.sleep(config.project.session_timeout)
        clear()

    if force_clear:
        clear()
    else:
        asyncio.ensure_future(clear_on_timeout(sid))


@socket.on("stop")
async def stop(sid):
    if session := WebsocketSession.get(sid):
        trace_event("stop_task")

        init_ws_context(session)
        await Message(
            author="System", content="Task stopped by the user.", disable_feedback=True
        ).send()

        session.should_stop = True

        if config.code.on_stop:
            await config.code.on_stop()


async def process_message(session: WebsocketSession, payload: UIMessagePayload):
    """Process a message from the user."""
    try:
        context = init_ws_context(session)
        await context.emitter.task_start()
        message = await context.emitter.process_user_message(payload)

        if config.code.on_message:
            await config.code.on_message(message)
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
async def message(sid, payload: UIMessagePayload):
    """Handle a message sent by the User."""
    session = WebsocketSession.require(sid)
    session.should_stop = False

    await process_message(session, payload)


async def process_action(action: Action):
    callback = config.code.action_callbacks.get(action.name)
    if callback:
        res = await callback(action)
        return res
    else:
        logger.warning("No callback found for action %s", action.name)


@socket.on("action_call")
async def call_action(sid, action):
    """Handle an action call from the UI."""
    context = init_ws_context(sid)

    action = Action(**action)

    try:
        res = await process_action(action)
        await context.emitter.send_action_response(
            id=action.id, status=True, response=res if isinstance(res, str) else None
        )

    except InterruptedError:
        await context.emitter.send_action_response(
            id=action.id, status=False, response="Action interrupted by the user"
        )
    except Exception as e:
        logger.exception(e)
        await context.emitter.send_action_response(
            id=action.id, status=False, response="An error occured"
        )


@socket.on("chat_settings_change")
async def change_settings(sid, settings: Dict[str, Any]):
    """Handle change settings submit from the UI."""
    context = init_ws_context(sid)

    for key, value in settings.items():
        context.session.chat_settings[key] = value

    if config.code.on_settings_update:
        await config.code.on_settings_update(settings)
