import asyncio
import json
import time
import uuid
from typing import Any, Dict, Literal
from urllib.parse import unquote

from chainlit.action import Action
from chainlit.auth import get_current_user, require_login
from chainlit.chat_context import chat_context
from chainlit.config import config
from chainlit.context import init_ws_context
from chainlit.data import get_data_layer
from chainlit.element import Element
from chainlit.logger import logger
from chainlit.message import ErrorMessage, Message
from chainlit.server import sio
from chainlit.session import WebsocketSession
from chainlit.telemetry import trace_event
from chainlit.types import (
    InputAudioChunk,
    InputAudioChunkPayload,
    MessagePayload,
)
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

    author = thread.get("userIdentifier")
    user_is_author = author == session.user.identifier

    if user_is_author:
        metadata = thread.get("metadata") or {}
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


@sio.on("connect")
async def connect(sid, environ):
    if (
        not config.code.on_chat_start
        and not config.code.on_message
        and not config.code.on_audio_chunk
    ):
        logger.warning(
            "You need to configure at least one of on_chat_start, on_message or on_audio_chunk callback"
        )
        return False
    user = None
    token = None
    login_required = require_login()
    try:
        # Check if the authentication is required
        if login_required:
            authorization_header = environ.get("HTTP_AUTHORIZATION")
            token = authorization_header.split(" ")[1] if authorization_header else None
            user = await get_current_user(token=token)
    except Exception:
        logger.info("Authentication failed")
        return False

    # Session scoped function to emit to the client
    def emit_fn(event, data):
        return sio.emit(event, data, to=sid)

    # Session scoped function to emit to the client and wait for a response
    def emit_call_fn(event: Literal["ask", "call_fn"], data, timeout):
        return sio.call(event, data, timeout=timeout, to=sid)

    session_id = environ.get("HTTP_X_CHAINLIT_SESSION_ID")
    if restore_existing_session(sid, session_id, emit_fn, emit_call_fn):
        return True

    user_env_string = environ.get("HTTP_USER_ENV")
    user_env = load_user_env(user_env_string)

    client_type = environ.get("HTTP_X_CHAINLIT_CLIENT_TYPE")
    http_referer = environ.get("HTTP_REFERER")
    url_encoded_chat_profile = environ.get("HTTP_X_CHAINLIT_CHAT_PROFILE")
    chat_profile = (
        unquote(url_encoded_chat_profile) if url_encoded_chat_profile else None
    )

    WebsocketSession(
        id=session_id,
        socket_id=sid,
        emit=emit_fn,
        emit_call=emit_call_fn,
        client_type=client_type,
        user_env=user_env,
        user=user,
        token=token,
        chat_profile=chat_profile,
        thread_id=environ.get("HTTP_X_CHAINLIT_THREAD_ID"),
        languages=environ.get("HTTP_ACCEPT_LANGUAGE"),
        http_referer=http_referer,
    )

    trace_event("connection_successful")
    return True


@sio.on("connection_successful")
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
            await context.emitter.emit(
                "first_interaction",
                {"interaction": "resume", "thread_id": thread.get("id")},
            )
            await config.code.on_chat_resume(thread)

            for step in thread.get("steps", []):
                if "message" in step["type"]:
                    chat_context.add(Message.from_dict(step))

            await context.emitter.resume_thread(thread)
            return

    if config.code.on_chat_start:
        task = asyncio.create_task(config.code.on_chat_start())
        context.session.current_task = task


@sio.on("clear_session")
async def clean_session(sid):
    session = WebsocketSession.get(sid)
    if session:
        session.to_clear = True


@sio.on("disconnect")
async def disconnect(sid):
    session = WebsocketSession.get(sid)

    if not session:
        return

    init_ws_context(session)

    if config.code.on_chat_end:
        await config.code.on_chat_end()

    if session.thread_id and session.has_first_interaction:
        await persist_user_session(session.thread_id, session.to_persistable())

    def clear(_sid):
        if session := WebsocketSession.get(_sid):
            # Clean up the user session
            if session.id in user_sessions:
                user_sessions.pop(session.id)
            # Clean up the session
            session.delete()

    if session.to_clear:
        clear(sid)
    else:

        async def clear_on_timeout(_sid):
            await asyncio.sleep(config.project.session_timeout)
            clear(_sid)

        asyncio.ensure_future(clear_on_timeout(sid))


@sio.on("stop")
async def stop(sid):
    if session := WebsocketSession.get(sid):
        trace_event("stop_task")

        init_ws_context(session)
        await Message(content="Task manually stopped.").send()

        if session.current_task:
            session.current_task.cancel()

        if config.code.on_stop:
            await config.code.on_stop()


async def process_message(session: WebsocketSession, payload: MessagePayload):
    """Process a message from the user."""
    try:
        context = init_ws_context(session)
        await context.emitter.task_start()
        message = await context.emitter.process_message(payload)

        if config.code.on_message:
            # Sleep 1ms to make sure any children step starts after the message step start
            time.sleep(0.001)
            await config.code.on_message(message)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.exception(e)
        await ErrorMessage(
            author="Error", content=str(e) or e.__class__.__name__
        ).send()
    finally:
        await context.emitter.task_end()


@sio.on("edit_message")
async def edit_message(sid, payload: MessagePayload):
    """Handle a message sent by the User."""
    session = WebsocketSession.require(sid)
    context = init_ws_context(session)

    messages = chat_context.get()

    orig_message = None

    for message in messages:
        if orig_message:
            await message.remove()

        if message.id == payload["message"]["id"]:
            message.content = payload["message"]["output"]
            await message.update()
            orig_message = message

    await context.emitter.task_start()

    if config.code.on_message:
        try:
            await config.code.on_message(orig_message)
        except asyncio.CancelledError:
            pass
        finally:
            await context.emitter.task_end()


@sio.on("client_message")
async def message(sid, payload: MessagePayload):
    """Handle a message sent by the User."""
    session = WebsocketSession.require(sid)

    task = asyncio.create_task(process_message(session, payload))
    session.current_task = task


@sio.on("window_message")
async def window_message(sid, data):
    """Handle a message send by the host window."""
    session = WebsocketSession.require(sid)
    context = init_ws_context(session)

    await context.emitter.task_start()

    if config.code.on_window_message:
        try:
            await config.code.on_window_message(data)
        except asyncio.CancelledError:
            pass
        finally:
            await context.emitter.task_end()

@sio.on("audio_start")
async def audio_start(sid):
    """Handle audio init."""
    session = WebsocketSession.require(sid)

    context = init_ws_context(session)
    if config.code.on_audio_start:
       connected = bool(await config.code.on_audio_start())
       connection_state = "on" if connected else "off"
       await context.emitter.update_audio_connection(connection_state)
        

@sio.on("audio_chunk")
async def audio_chunk(sid, payload: InputAudioChunkPayload):
    """Handle an audio chunk sent by the user."""
    session = WebsocketSession.require(sid)

    init_ws_context(session)

    if config.code.on_audio_chunk:
        asyncio.create_task(config.code.on_audio_chunk(InputAudioChunk(**payload)))


@sio.on("audio_end")
async def audio_end(sid):
    """Handle the end of the audio stream."""
    session = WebsocketSession.require(sid)
    try:
        context = init_ws_context(session)
        await context.emitter.task_start()

        if not session.has_first_interaction:
            session.has_first_interaction = True
            asyncio.create_task(context.emitter.init_thread("audio"))

        if config.code.on_audio_end:
            await config.code.on_audio_end()
            
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.exception(e)
        await ErrorMessage(
            author="Error", content=str(e) or e.__class__.__name__
        ).send()
    finally:
        await context.emitter.task_end()


async def process_action(action: Action):
    callback = config.code.action_callbacks.get(action.name)
    if callback:
        res = await callback(action)
        return res
    else:
        logger.warning("No callback found for action %s", action.name)


@sio.on("action_call")
async def call_action(sid, action):
    """Handle an action call from the UI."""
    context = init_ws_context(sid)

    action = Action(**action)

    try:
        if not context.session.has_first_interaction:
            context.session.has_first_interaction = True
            asyncio.create_task(context.emitter.init_thread(action.name))
        res = await process_action(action)
        await context.emitter.send_action_response(
            id=action.id, status=True, response=res if isinstance(res, str) else None
        )

    except asyncio.CancelledError:
        await context.emitter.send_action_response(
            id=action.id, status=False, response="Action interrupted by the user"
        )
    except Exception as e:
        logger.exception(e)
        await context.emitter.send_action_response(
            id=action.id, status=False, response="An error occurred"
        )


@sio.on("chat_settings_change")
async def change_settings(sid, settings: Dict[str, Any]):
    """Handle change settings submit from the UI."""
    context = init_ws_context(sid)

    for key, value in settings.items():
        context.session.chat_settings[key] = value

    if config.code.on_settings_update:
        await config.code.on_settings_update(settings)
