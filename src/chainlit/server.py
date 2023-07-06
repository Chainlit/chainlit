import mimetypes

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

import os
import json
import webbrowser
from pathlib import Path


from contextlib import asynccontextmanager
from watchfiles import awatch

from fastapi import FastAPI, Request
from fastapi.responses import (
    HTMLResponse,
    JSONResponse,
    FileResponse,
    PlainTextResponse,
)
from fastapi_socketio import SocketManager
from starlette.middleware.cors import CORSMiddleware
import asyncio

from chainlit.context import emitter_var, loop_var
from chainlit.config import config, load_module, reload_config, DEFAULT_HOST
from chainlit.session import Session, sessions
from chainlit.user_session import user_sessions
from chainlit.client.utils import (
    get_db_client,
    get_auth_client,
    get_auth_client_from_request,
    get_db_client_from_request,
)
from chainlit.emitter import ChainlitEmitter
from chainlit.markdown import get_markdown_str
from chainlit.action import Action
from chainlit.message import Message, ErrorMessage
from chainlit.telemetry import trace_event
from chainlit.client.cloud import CloudAuthClient
from chainlit.logger import logger
from chainlit.types import (
    CompletionRequest,
    UpdateFeedbackRequest,
    GetConversationsRequest,
    DeleteConversationRequest,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    host = config.run.host
    port = config.run.port

    if host == DEFAULT_HOST:
        url = f"http://localhost:{port}"
    else:
        url = f"http://{host}:{port}"

    logger.info(f"Your app is available at {url}")

    if not config.run.headless:
        # Add a delay before opening the browser
        await asyncio.sleep(1)
        webbrowser.open(url)

    if config.project.database == "local":
        from prisma import Client, register

        client = Client()
        register(client)
        await client.connect()

    watch_task = None
    stop_event = asyncio.Event()

    if config.run.watch:

        async def watch_files_for_changes():
            extensions = [".py"]
            files = ["chainlit.md", "config.toml"]
            async for changes in awatch(config.root, stop_event=stop_event):
                for change_type, file_path in changes:
                    file_name = os.path.basename(file_path)
                    file_ext = os.path.splitext(file_name)[1]

                    if file_ext.lower() in extensions or file_name.lower() in files:
                        logger.info(
                            f"File {change_type.name}: {file_name}. Reloading app..."
                        )

                        try:
                            reload_config()
                        except Exception as e:
                            logger.error(f"Error reloading config: {e}")
                            break

                        # Reload the module if the module name is specified in the config
                        if config.run.module_name:
                            try:
                                load_module(config.run.module_name)
                            except Exception as e:
                                logger.error(f"Error reloading module: {e}")
                                break

                        await socket.emit("reload", {})

                        break

        watch_task = asyncio.create_task(watch_files_for_changes())

    try:
        yield
    finally:
        if config.project.database == "local":
            await client.disconnect()
        if watch_task:
            try:
                stop_event.set()
                watch_task.cancel()
                await watch_task
            except asyncio.exceptions.CancelledError:
                pass

        # Force exit the process to avoid potential AnyIO threads still running
        os._exit(0)


root_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(root_dir, "frontend/dist")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define max HTTP data size to 100 MB
max_http_data_size = 100 * 1024 * 1024

socket = SocketManager(
    app,
    cors_allowed_origins=[],
    async_mode="asgi",
    max_http_buffer_size=max_http_data_size,
)

"""
-------------------------------------------------------------------------------
                              HTTP HANDLERS
-------------------------------------------------------------------------------
"""


def get_html_template():
    PLACEHOLDER = "<!-- TAG INJECTION PLACEHOLDER -->"

    default_url = "https://github.com/Chainlit/chainlit"
    url = config.ui.github or default_url

    tags = f"""<title>{config.ui.name}</title>
    <meta name="description" content="{config.ui.description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{config.ui.name}">
    <meta property="og:description" content="{config.ui.description}">
    <meta property="og:image" content="https://chainlit-cloud.s3.eu-west-3.amazonaws.com/logo/chainlit_banner.png">
    <meta property="og:url" content="{url}">"""

    index_html_file_path = os.path.join(build_dir, "index.html")

    with open(index_html_file_path, "r", encoding="utf-8") as f:
        content = f.read()
        content = content.replace(PLACEHOLDER, tags)
        return content


html_template = get_html_template()


@app.post("/completion")
async def completion(completion: CompletionRequest):
    """Handle a completion request from the prompt playground."""

    import openai

    trace_event("completion")

    api_key = completion.userEnv.get("OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY"))

    model_name = completion.settings.model_name
    stop = completion.settings.stop
    # OpenAI doesn't support an empty stop array, clear it
    if isinstance(stop, list) and len(stop) == 0:
        stop = None

    if model_name in ["gpt-3.5-turbo", "gpt-4"]:
        response = await openai.ChatCompletion.acreate(
            api_key=api_key,
            model=model_name,
            messages=[{"role": "user", "content": completion.prompt}],
            stop=stop,
            **completion.settings.to_settings_dict(),
        )
        return PlainTextResponse(content=response["choices"][0]["message"]["content"])
    else:
        response = await openai.Completion.acreate(
            api_key=api_key,
            model=model_name,
            prompt=completion.prompt,
            stop=stop,
            **completion.settings.to_settings_dict(),
        )
        return PlainTextResponse(content=response["choices"][0]["text"])


@app.get("/project/settings")
async def project_settings():
    """Return project settings. This is called by the UI before the establishing the websocket connection."""
    return JSONResponse(
        content={
            "chainlitServer": config.chainlit_server,
            "prod": bool(config.chainlit_prod_url),
            "ui": config.ui.to_dict(),
            "project": config.project.to_dict(),
            "markdown": get_markdown_str(config.root),
        }
    )


@app.put("/message/feedback")
async def update_feedback(request: Request, update: UpdateFeedbackRequest):
    """Update the human feedback for a particular message."""

    db_client = await get_db_client_from_request(request)
    await db_client.set_human_feedback(
        message_id=update.messageId, feedback=update.feedback
    )
    return JSONResponse(content={"success": True})


@app.get("/project/members")
async def get_project_members(request: Request):
    """Get all the members of a project."""

    get_db_client = await get_db_client_from_request(request)
    res = await get_db_client.get_project_members()
    return JSONResponse(content=res)


@app.get("/project/role")
async def get_member_role(request: Request):
    """Get the role of a member."""

    auth_client = await get_auth_client_from_request(request)
    role = auth_client.user_infos["role"] if auth_client.user_infos else "ANONYMOUS"
    return PlainTextResponse(content=role)


@app.post("/project/conversations")
async def get_project_conversations(request: Request, payload: GetConversationsRequest):
    """Get the conversations page by page."""

    db_client = await get_db_client_from_request(request)
    res = await db_client.get_conversations(payload.pagination, payload.filter)
    return JSONResponse(content=res.to_dict())


@app.get("/project/conversation/{conversation_id}")
async def get_conversation(request: Request, conversation_id: str):
    """Get a specific conversation."""

    db_client = await get_db_client_from_request(request)
    res = await db_client.get_conversation(int(conversation_id))
    return JSONResponse(content=res)


@app.get("/project/conversation/{conversation_id}/element/{element_id}")
async def get_conversation(request: Request, conversation_id: str, element_id: str):
    """Get a specific conversation."""

    db_client = await get_db_client_from_request(request)
    res = await db_client.get_element(int(conversation_id), int(element_id))
    return JSONResponse(content=res)


@app.delete("/project/conversation")
async def delete_conversation(request: Request, payload: DeleteConversationRequest):
    """Delete a conversation."""

    db_client = await get_db_client_from_request(request)
    await db_client.delete_conversation(conversation_id=payload.conversationId)
    return JSONResponse(content={"success": True})


@app.get("/files/{filename:path}")
async def serve_file(filename: str):
    file_path = Path(config.project.local_fs_path) / filename
    if file_path.is_file():
        return FileResponse(file_path)
    else:
        return {"error": "File not found"}


@app.get("/{path:path}")
async def serve(path: str):
    """Serve the UI and app files."""
    if path:
        app_file_path = os.path.join(config.root, path)
        ui_file_path = os.path.join(build_dir, path)
        file_paths = [app_file_path, ui_file_path]

        for file_path in file_paths:
            if os.path.isfile(file_path):
                return FileResponse(file_path)

    return HTMLResponse(content=html_template, status_code=200)


"""
-------------------------------------------------------------------------------
                              WEBSOCKET HANDLERS
-------------------------------------------------------------------------------
"""


def need_session(id: str):
    """Return the session with the given id."""

    session = sessions.get(id)
    if not session:
        raise ValueError("Session not found")
    return session


@socket.on("connect")
async def connect(sid, environ):
    user_env = environ.get("HTTP_USER_ENV")
    authorization = environ.get("HTTP_AUTHORIZATION")

    try:
        auth_client = await get_auth_client(authorization)
        db_client = await get_db_client(authorization, auth_client.user_infos)

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

    except ConnectionRefusedError as e:
        logger.error(f"ConnectionRefusedError: {e}")
        return False

    # Function to send a message to this particular session
    def emit_fn(event, data):
        if sid in sessions:
            if sessions[sid]["should_stop"]:
                sessions[sid]["should_stop"] = False
                raise InterruptedError("Task stopped by user")
        return socket.emit(event, data, to=sid)

    # Function to ask the user a question
    def ask_user_fn(data, timeout):
        if sessions[sid]["should_stop"]:
            sessions[sid]["should_stop"] = False
            raise InterruptedError("Task stopped by user")
        return socket.call("ask", data, timeout=timeout, to=sid)

    session = {
        "id": sid,
        "emit": emit_fn,
        "ask_user": ask_user_fn,
        "auth_client": auth_client,
        "db_client": db_client,
        "user_env": user_env,
        "should_stop": False,
    }  # type: Session

    sessions[sid] = session

    trace_event("connection_successful")
    return True


@socket.on("connection_successful")
async def connection_successful(sid):
    session = need_session(sid)
    emitter_var.set(ChainlitEmitter(session))
    loop_var.set(asyncio.get_event_loop())

    if isinstance(
        session["auth_client"], CloudAuthClient
    ) and config.project.database in ["local", "custom"]:
        await session["db_client"].create_user(session["auth_client"].user_infos)

    if config.code.on_chat_start:
        """Call the on_chat_start function provided by the developer."""
        await config.code.on_chat_start()

    if config.code.lc_factory:
        """Instantiate the langchain agent and store it in the session."""
        agent = await config.code.lc_factory()
        session["agent"] = agent

    if config.code.llama_index_factory:
        llama_instance = await config.code.llama_index_factory()
        session["llama_instance"] = llama_instance


@socket.on("disconnect")
async def disconnect(sid):
    if sid in sessions:
        # Clean up the session
        sessions.pop(sid)

    if sid in user_sessions:
        # Clean up the user session
        user_sessions.pop(sid)


@socket.on("stop")
async def stop(sid):
    if sid in sessions:
        trace_event("stop_task")
        session = sessions[sid]

        emitter_var.set(ChainlitEmitter(session))
        loop_var.set(asyncio.get_event_loop())

        await Message(author="System", content="Task stopped by the user.").send()

        session["should_stop"] = True

        if config.code.on_stop:
            await config.code.on_stop()


async def process_message(session: Session, author: str, input_str: str):
    """Process a message from the user."""

    try:
        emitter = ChainlitEmitter(session)
        emitter_var.set(emitter)
        loop_var.set(asyncio.get_event_loop())

        await emitter.task_start()

        if session["db_client"]:
            # If cloud is enabled, persist the message
            await session["db_client"].create_message(
                {
                    "author": author,
                    "content": input_str,
                    "authorIsUser": True,
                }
            )

        langchain_agent = session.get("agent")
        llama_instance = session.get("llama_instance")

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
                raw_res, output_key = await run_langchain_agent(
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
    session = need_session(sid)
    session["should_stop"] = False

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
    session = need_session(sid)
    emitter_var.set(ChainlitEmitter(session))
    loop_var.set(asyncio.get_event_loop())

    action = Action(**action)

    await process_action(action)
