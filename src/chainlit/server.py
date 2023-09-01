import json
import mimetypes

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

import asyncio
import os
import webbrowser
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi_socketio import SocketManager
from starlette.middleware.cors import CORSMiddleware
from watchfiles import awatch

from chainlit.client.utils import (
    get_auth_client_from_request,
    get_db_client_from_request,
)
from chainlit.config import DEFAULT_HOST, config, load_module, reload_config
from chainlit.logger import logger
from chainlit.markdown import get_markdown_str
from chainlit.playground.config import get_llm_providers
from chainlit.telemetry import trace_event
from chainlit.types import (
    CompletionRequest,
    DeleteConversationRequest,
    GetConversationsRequest,
    UpdateFeedbackRequest,
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
        from prisma import Client, register  # type: ignore[attr-defined]

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

app.mount("/public", StaticFiles(directory="public", check_dir=False), name="public")
app.mount(
    "/assets",
    StaticFiles(
        packages=[("chainlit", os.path.join(build_dir, "assets"))],
        follow_symlink=config.project.follow_symlink,
    ),
    name="assets",
)


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
    JS_PLACEHOLDER = "<!-- JS INJECTION PLACEHOLDER -->"

    default_url = "https://github.com/Chainlit/chainlit"
    url = config.ui.github or default_url

    tags = f"""<title>{config.ui.name}</title>
    <meta name="description" content="{config.ui.description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{config.ui.name}">
    <meta property="og:description" content="{config.ui.description}">
    <meta property="og:image" content="https://chainlit-cloud.s3.eu-west-3.amazonaws.com/logo/chainlit_banner.png">
    <meta property="og:url" content="{url}">"""

    js = None
    if config.ui.theme:
        js = f"""<script>window.theme = {json.dumps(config.ui.theme.to_dict())}</script>"""

    index_html_file_path = os.path.join(build_dir, "index.html")

    with open(index_html_file_path, "r", encoding="utf-8") as f:
        content = f.read()
        content = content.replace(PLACEHOLDER, tags)
        if js:
            content = content.replace(JS_PLACEHOLDER, js)
        return content


@app.post("/completion")
async def completion(request: CompletionRequest):
    """Handle a completion request from the prompt playground."""

    providers = get_llm_providers()

    try:
        provider = [p for p in providers if p.id == request.prompt.provider][0]
    except IndexError:
        raise HTTPException(
            status_code=404,
            detail=f"LLM provider '{request.prompt.provider}' not found",
        )

    trace_event("pp_create_completion")
    response = await provider.create_completion(request)

    return response


@app.get("/project/llm-providers")
async def get_providers():
    """List the providers."""
    trace_event("pp_get_llm_providers")
    providers = get_llm_providers()
    providers = [p.to_dict() for p in providers]
    return JSONResponse(content={"providers": providers})


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

    db_client = await get_db_client_from_request(request)
    res = await db_client.get_project_members()
    return JSONResponse(content=res)


@app.get("/project/role")
async def get_member_role(request: Request):
    """Get the role of a member."""

    auth_client = await get_auth_client_from_request(request)
    role = auth_client.user_infos["role"] if auth_client.user_infos else "ANONYMOUS"
    return JSONResponse(content=role)


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
    res = await db_client.get_conversation(conversation_id)
    return JSONResponse(content=res)


@app.get("/project/conversation/{conversation_id}/element/{element_id}")
async def get_conversation_element(
    request: Request, conversation_id: str, element_id: str
):
    """Get a specific conversation element."""

    db_client = await get_db_client_from_request(request)
    res = await db_client.get_element(conversation_id, element_id)
    return JSONResponse(content=res)


@app.delete("/project/conversation")
async def delete_conversation(request: Request, payload: DeleteConversationRequest):
    """Delete a conversation."""

    db_client = await get_db_client_from_request(request)
    await db_client.delete_conversation(conversation_id=payload.conversationId)
    return JSONResponse(content={"success": True})


@app.get("/files/{filename:path}")
async def serve_file(filename: str):
    base_path = Path(config.project.local_fs_path).resolve()
    file_path = (base_path / filename).resolve()

    # Check if the base path is a parent of the file path
    if base_path not in file_path.parents:
        raise HTTPException(status_code=400, detail="Invalid filename")

    if file_path.is_file():
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")


@app.get("/favicon.svg")
async def get_favicon():
    favicon_path = os.path.join(build_dir, "favicon.svg")
    return FileResponse(favicon_path, media_type="image/svg+xml")


def register_wildcard_route_handler():
    @app.get("/{path:path}")
    async def serve(request: Request, path: str):
        html_template = get_html_template()
        """Serve the UI files."""
        response = HTMLResponse(content=html_template, status_code=200)

        key = "chainlit-initial-headers"

        chainlit_initial_headers = dict(request.headers)
        if "cookie" in chainlit_initial_headers:
            del chainlit_initial_headers["cookie"]

        response.set_cookie(
            key=key,
            value=json.dumps(chainlit_initial_headers),
            httponly=True,
        )

        return response


import chainlit.socket  # noqa
