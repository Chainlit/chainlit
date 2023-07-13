import json

import asyncio

from chainlit.context import emitter_var, loop_var
from chainlit.config import config
from chainlit.session import Session
from chainlit.user_session import user_sessions
from chainlit.client.utils import (
    get_db_client,
    get_auth_client,
)
from chainlit.emitter import ChainlitEmitter
from chainlit.action import Action
from chainlit.message import Message, ErrorMessage
from chainlit.telemetry import trace_event
from chainlit.client.cloud import CloudAuthClient
from chainlit.logger import logger
from chainlit.server import socket


def restore_existing_session(sid, auth, emit_fn, ask_user_fn):
    """Restore a session from the sessionId provided by the client."""

    session_id = auth and auth.get("sessionId")
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

    if restore_existing_session(sid, auth, emit_fn, ask_user_fn):
        return

    user_env = environ.get("HTTP_USER_ENV")
    authorization = environ.get("HTTP_AUTHORIZATION")

    try:
        auth_client = await get_auth_client(authorization)
        db_client = await get_db_client(authorization, auth_client.user_infos)
        user_env = load_user_env(user_env)
    except ConnectionRefusedError as e:
        logger.error(f"ConnectionRefusedError: {e}")
        return False

    session = Session(
        socket_id=sid,
        emit=emit_fn,
        ask_user=ask_user_fn,
        auth_client=auth_client,
        db_client=db_client,
        user_env=user_env,
    )

    await socket.emit("session", data={"sessionId": session.id}, to=sid)

    trace_event("connection_successful")
    return True


@socket.on("connection_successful")
async def connection_successful(sid):
    session = Session.require(sid)
    if session.restored:
        return

    emitter_var.set(ChainlitEmitter(session))
    loop_var.set(asyncio.get_event_loop())

    if isinstance(session.auth_client, CloudAuthClient) and config.project.database in [
        "local",
        "custom",
    ]:
        await session.db_client.create_user(session.auth_client.user_infos)

    if config.code.on_chat_start:
        """Call the on_chat_start function provided by the developer."""
        await config.code.on_chat_start()

    if config.code.lc_factory:
        """Instantiate the langchain agent and store it in the session."""
        agent = await config.code.lc_factory()
        session.agent = agent

    if config.code.llama_index_factory:
        llama_instance = await config.code.llama_index_factory()
        session.llama_instance = llama_instance


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

        emitter_var.set(ChainlitEmitter(session))
        loop_var.set(asyncio.get_event_loop())

        await Message(author="System", content="Task stopped by the user.").send()

        session.should_stop = True

        if config.code.on_stop:
            await config.code.on_stop()


async def process_message(session: Session, author: str, input_str: str):
    """Process a message from the user."""

    try:
        emitter = ChainlitEmitter(session)
        emitter_var.set(emitter)
        loop_var.set(asyncio.get_event_loop())

        await emitter.task_start()

        if session.db_client:
            # If cloud is enabled, persist the message
            await session.db_client.create_message(
                {
                    "author": author,
                    "content": input_str,
                    "authorIsUser": True,
                }
            )

        langchain_agent = session.agent
        llama_instance = session.llama_instance

        if langchain_agent:
            from chainlit.lc.agent import run_langchain_agent

            # If a langchain agent is available, run it
            if config.code.lc_run:
                # If the developer provided a custom run function, use it
                await config.code.lc_run(
                    langchain_agent,
                    input_str,
                )
                return
            else:
                # Otherwise, use the default run function
                (
                    raw_res,
                    output_key,
                    has_streamed_final_answer,
                ) = await run_langchain_agent(
                    langchain_agent, input_str, use_async=config.code.lc_agent_is_async
                )

                if config.code.lc_postprocess:
                    # If the developer provided a custom postprocess function, use it
                    await config.code.lc_postprocess(raw_res)
                    return
                elif output_key is not None:
                    # Use the output key if provided
                    res = raw_res[output_key]
                else:
                    # Otherwise, use the raw response
                    res = raw_res

            # Finally, send the response to the user
            if not has_streamed_final_answer:
                await Message(author=config.ui.name, content=res).send()

        elif llama_instance:
            from chainlit.llama_index.run import run_llama

            await run_llama(llama_instance, input_str)

        elif config.code.on_message:
            # If no langchain agent is available, call the on_message function provided by the developer
            await config.code.on_message(input_str)
    except InterruptedError:
        pass
    except Exception as e:
        logger.exception(e)
        await ErrorMessage(
            author="Error", content=str(e) or e.__class__.__name__
        ).send()
    finally:
        await emitter.task_end()


@socket.on("ui_message")
async def message(sid, data):
    """Handle a message sent by the User."""
    session = Session.require(sid)
    session.should_stop = False

    input_str = data["content"].strip()
    author = data["author"]

    await process_message(session, author, input_str)


async def process_action(action: Action):
    callback = config.code.action_callbacks.get(action.name)
    if callback:
        await callback(action)
    else:
        logger.warning("No callback found for action %s", action.name)


@socket.on("action_call")
async def call_action(sid, action):
    """Handle an action call from the UI."""
    session = Session.require(sid)
    emitter_var.set(ChainlitEmitter(session))
    loop_var.set(asyncio.get_event_loop())

    action = Action(**action)

    await process_action(action)
