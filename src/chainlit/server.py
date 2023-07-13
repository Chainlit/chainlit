import mimetypes

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

import os
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

from chainlit.config import config, load_module, reload_config, DEFAULT_HOST
from chainlit.client.utils import (
    get_auth_client_from_request,
    get_db_client_from_request,
)
from chainlit.markdown import get_markdown_str
from chainlit.telemetry import trace_event
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
max_message_size = 100 * 1024 * 1024

socket = SocketManager(
    app,
    cors_allowed_origins=[],
    async_mode="asgi",
    max_http_buffer_size=max_message_size,
)


# -------------------------------------------------------------------------------
#                               HTTP HANDLERS
# -------------------------------------------------------------------------------


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


def register_wildcard_route_handler():
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


import chainlit.socket  # noqa
