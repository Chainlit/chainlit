import asyncio
import glob
import json
import mimetypes
import os
import re
import shutil
import urllib.parse
import webbrowser
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional, Union

import socketio
from chainlit.auth import create_jwt, get_configuration, get_current_user
from chainlit.config import (
    APP_ROOT,
    BACKEND_ROOT,
    DEFAULT_HOST,
    FILES_DIRECTORY,
    PACKAGE_ROOT,
    config,
    load_module,
    reload_config,
)
from chainlit.data import get_data_layer
from chainlit.data.acl import is_thread_author
from chainlit.logger import logger
from chainlit.markdown import get_markdown_str
from chainlit.oauth_providers import get_oauth_provider
from chainlit.secret import random_secret
from chainlit.types import (
    DeleteFeedbackRequest,
    DeleteThreadRequest,
    GetThreadsRequest,
    Theme,
    UpdateFeedbackRequest,
)
from chainlit.user import PersistedUser, User
from fastapi import (
    APIRouter,
    Depends,
    FastAPI,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from starlette.datastructures import URL
from starlette.middleware.cors import CORSMiddleware
from typing_extensions import Annotated
from watchfiles import awatch

from ._utils import is_path_inside

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

ROOT_PATH = os.environ.get("CHAINLIT_ROOT_PATH", "")
IS_SUBMOUNT = os.environ.get("CHAINLIT_SUBMOUNT", "") == "true"
# If the app is a submount, no need to set the prefix
PREFIX = ROOT_PATH if ROOT_PATH and not IS_SUBMOUNT else ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Context manager to handle app start and shutdown."""
    host = config.run.host
    port = config.run.port

    if host == DEFAULT_HOST:
        url = f"http://localhost:{port}{ROOT_PATH}"
    else:
        url = f"http://{host}:{port}{ROOT_PATH}"

    logger.info(f"Your app is available at {url}")

    if not config.run.headless:
        # Add a delay before opening the browser
        await asyncio.sleep(1)
        webbrowser.open(url)

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
                                load_module(config.run.module_name, force_refresh=True)
                            except Exception as e:
                                logger.error(f"Error reloading module: {e}")

                        await asyncio.sleep(1)
                        await sio.emit("reload", {})

                        break

        watch_task = asyncio.create_task(watch_files_for_changes())

    discord_task = None

    if discord_bot_token := os.environ.get("DISCORD_BOT_TOKEN"):
        from chainlit.discord.app import client

        discord_task = asyncio.create_task(client.start(discord_bot_token))

    try:
        yield
    finally:
        try:
            if watch_task:
                stop_event.set()
                watch_task.cancel()
                await watch_task

            if discord_task:
                discord_task.cancel()
                await discord_task
        except asyncio.exceptions.CancelledError:
            pass

        if FILES_DIRECTORY.is_dir():
            shutil.rmtree(FILES_DIRECTORY)

        # Force exit the process to avoid potential AnyIO threads still running
        os._exit(0)


def get_build_dir(local_target: str, packaged_target: str) -> str:
    """
    Get the build directory based on the UI build strategy.

    Args:
        local_target (str): The local target directory.
        packaged_target (str): The packaged target directory.

    Returns:
        str: The build directory
    """

    local_build_dir = os.path.join(PACKAGE_ROOT, local_target, "dist")
    packaged_build_dir = os.path.join(BACKEND_ROOT, packaged_target, "dist")

    if config.ui.custom_build and os.path.exists(
        os.path.join(APP_ROOT, config.ui.custom_build)
    ):
        return os.path.join(APP_ROOT, config.ui.custom_build)
    elif os.path.exists(local_build_dir):
        return local_build_dir
    elif os.path.exists(packaged_build_dir):
        return packaged_build_dir
    else:
        raise FileNotFoundError(f"{local_target} built UI dir not found")


build_dir = get_build_dir("frontend", "frontend")
copilot_build_dir = get_build_dir(os.path.join("libs", "copilot"), "copilot")

app = FastAPI(lifespan=lifespan)

sio = socketio.AsyncServer(cors_allowed_origins=[], async_mode="asgi")

asgi_app = socketio.ASGIApp(
    socketio_server=sio,
    socketio_path="",
)

app.mount(f"{PREFIX}/ws/socket.io", asgi_app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.project.allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix=PREFIX)

app.mount(
    f"{PREFIX}/public",
    StaticFiles(directory="public", check_dir=False),
    name="public",
)

app.mount(
    f"{PREFIX}/assets",
    StaticFiles(
        packages=[("chainlit", os.path.join(build_dir, "assets"))],
        follow_symlink=config.project.follow_symlink,
    ),
    name="assets",
)

app.mount(
    f"{PREFIX}/copilot",
    StaticFiles(
        packages=[("chainlit", copilot_build_dir)],
        follow_symlink=config.project.follow_symlink,
    ),
    name="copilot",
)


# -------------------------------------------------------------------------------
#                               SLACK HANDLER
# -------------------------------------------------------------------------------

if os.environ.get("SLACK_BOT_TOKEN") and os.environ.get("SLACK_SIGNING_SECRET"):
    from chainlit.slack.app import slack_app_handler

    @router.post("/slack/events")
    async def slack_endpoint(req: Request):
        return await slack_app_handler.handle(req)


# -------------------------------------------------------------------------------
#                               TEAMS HANDLER
# -------------------------------------------------------------------------------

if os.environ.get("TEAMS_APP_ID") and os.environ.get("TEAMS_APP_PASSWORD"):
    from botbuilder.schema import Activity
    from chainlit.teams.app import adapter, bot

    @router.post("/teams/events")
    async def teams_endpoint(req: Request):
        body = await req.json()
        activity = Activity().deserialize(body)
        auth_header = req.headers.get("Authorization", "")
        response = await adapter.process_activity(activity, auth_header, bot.on_turn)
        return response


# -------------------------------------------------------------------------------
#                               HTTP HANDLERS
# -------------------------------------------------------------------------------


def replace_between_tags(
    text: str, start_tag: str, end_tag: str, replacement: str
) -> str:
    """Replace text between two tags in a string."""

    pattern = start_tag + ".*?" + end_tag
    return re.sub(pattern, start_tag + replacement + end_tag, text, flags=re.DOTALL)


def get_html_template():
    """
    Get HTML template for the index view.
    """
    PLACEHOLDER = "<!-- TAG INJECTION PLACEHOLDER -->"
    JS_PLACEHOLDER = "<!-- JS INJECTION PLACEHOLDER -->"
    CSS_PLACEHOLDER = "<!-- CSS INJECTION PLACEHOLDER -->"

    default_url = "https://github.com/Chainlit/chainlit"
    default_meta_image_url = (
        "https://chainlit-cloud.s3.eu-west-3.amazonaws.com/logo/chainlit_banner.png"
    )
    url = config.ui.github or default_url
    meta_image_url = config.ui.custom_meta_image_url or default_meta_image_url
    favicon_path = "/favicon"

    tags = f"""<title>{config.ui.name}</title>
    <link rel="icon" href="{favicon_path}" />
    <meta name="description" content="{config.ui.description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{config.ui.name}">
    <meta property="og:description" content="{config.ui.description}">
    <meta property="og:image" content="{meta_image_url}">
    <meta property="og:url" content="{url}">
    <meta property="og:root_path" content="{ROOT_PATH}">"""

    js = f"""<script>{f"window.theme = {json.dumps(config.ui.theme.to_dict())}; " if config.ui.theme else ""}</script>"""

    css = None
    if config.ui.custom_css:
        css = (
            f"""<link rel="stylesheet" type="text/css" href="{config.ui.custom_css}">"""
        )

    if config.ui.custom_js:
        js += f"""<script src="{config.ui.custom_js}" defer></script>"""

    font = None
    if config.ui.custom_font:
        font = f"""<link rel="stylesheet" href="{config.ui.custom_font}">"""

    index_html_file_path = os.path.join(build_dir, "index.html")

    with open(index_html_file_path, "r", encoding="utf-8") as f:
        content = f.read()
        content = content.replace(PLACEHOLDER, tags)
        if js:
            content = content.replace(JS_PLACEHOLDER, js)
        if css:
            content = content.replace(CSS_PLACEHOLDER, css)
        if font:
            content = replace_between_tags(
                content, "<!-- FONT START -->", "<!-- FONT END -->", font
            )
        if ROOT_PATH:
            content = content.replace('href="/', f'href="{ROOT_PATH}/')
            content = content.replace('src="/', f'src="{ROOT_PATH}/')
        return content


def get_user_facing_url(url: URL):
    """
    Return the user facing URL for a given URL.
    Handles deployment with proxies (like cloud run).
    """
    chainlit_url = os.environ.get("CHAINLIT_URL")

    # No config, we keep the URL as is
    if not chainlit_url:
        url = url.replace(query="", fragment="")
        return url.__str__()

    config_url = URL(chainlit_url).replace(
        query="",
        fragment="",
    )
    # Remove trailing slash from config URL
    if config_url.path.endswith("/"):
        config_url = config_url.replace(path=config_url.path[:-1])

    return config_url.__str__() + url.path


@router.get("/auth/config")
async def auth(request: Request):
    return get_configuration()


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login a user using the password auth callback.
    """
    if not config.code.password_auth_callback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No auth_callback defined"
        )

    user = await config.code.password_auth_callback(
        form_data.username, form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="credentialssignin",
        )
    access_token = create_jwt(user)
    if data_layer := get_data_layer():
        try:
            await data_layer.create_user(user)
        except Exception as e:
            logger.error(f"Error creating user: {e}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout the user by calling the on_logout callback."""
    if config.code.on_logout:
        return await config.code.on_logout(request, response)
    return {"success": True}


@router.post("/auth/header")
async def header_auth(request: Request):
    """Login a user using the header_auth_callback."""
    if not config.code.header_auth_callback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No header_auth_callback defined",
        )

    user = await config.code.header_auth_callback(request.headers)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    access_token = create_jwt(user)
    if data_layer := get_data_layer():
        try:
            await data_layer.create_user(user)
        except Exception as e:
            logger.error(f"Error creating user: {e}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/auth/oauth/{provider_id}")
async def oauth_login(provider_id: str, request: Request):
    """Redirect the user to the oauth provider login page."""
    if config.code.oauth_callback is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No oauth_callback defined",
        )

    provider = get_oauth_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider {provider_id} not found",
        )

    random = random_secret(32)

    params = urllib.parse.urlencode(
        {
            "client_id": provider.client_id,
            "redirect_uri": f"{get_user_facing_url(request.url)}/callback",
            "state": random,
            **provider.authorize_params,
        }
    )
    response = RedirectResponse(
        url=f"{provider.authorize_url}?{params}",
    )
    samesite: Any = os.environ.get("CHAINLIT_COOKIE_SAMESITE", "lax")
    secure = samesite.lower() == "none"
    response.set_cookie(
        "oauth_state",
        random,
        httponly=True,
        samesite=samesite,
        secure=secure,
        max_age=3 * 60,
    )
    return response


@router.get("/auth/oauth/{provider_id}/callback")
async def oauth_callback(
    provider_id: str,
    request: Request,
    error: Optional[str] = None,
    code: Optional[str] = None,
    state: Optional[str] = None,
):
    """Handle the oauth callback and login the user."""

    if config.code.oauth_callback is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No oauth_callback defined",
        )

    provider = get_oauth_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider {provider_id} not found",
        )

    if error:
        params = urllib.parse.urlencode(
            {
                "error": error,
            }
        )
        response = RedirectResponse(
            # FIXME: redirect to the right frontend base url to improve the dev environment
            url=f"/login?{params}",
        )
        return response

    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing code or state",
        )

    # Check the state from the oauth provider against the browser cookie
    oauth_state = request.cookies.get("oauth_state")
    if oauth_state != state:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    url = get_user_facing_url(request.url)
    token = await provider.get_token(code, url)

    (raw_user_data, default_user) = await provider.get_user_info(token)

    user = await config.code.oauth_callback(
        provider_id, token, raw_user_data, default_user
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    access_token = create_jwt(user)

    if data_layer := get_data_layer():
        try:
            await data_layer.create_user(user)
        except Exception as e:
            logger.error(f"Error creating user: {e}")

    params = urllib.parse.urlencode(
        {
            "access_token": access_token,
            "token_type": "bearer",
        }
    )

    root_path = os.environ.get("CHAINLIT_ROOT_PATH", "")

    response = RedirectResponse(
        # FIXME: redirect to the right frontend base url to improve the dev environment
        url=f"{root_path}/login/callback?{params}",
    )
    response.delete_cookie("oauth_state")
    return response


# specific route for azure ad hybrid flow
@router.post("/auth/oauth/azure-ad-hybrid/callback")
async def oauth_azure_hf_callback(
    request: Request,
    error: Optional[str] = None,
    code: Annotated[Optional[str], Form()] = None,
    id_token: Annotated[Optional[str], Form()] = None,
):
    """Handle the azure ad hybrid flow callback and login the user."""

    provider_id = "azure-ad-hybrid"
    if config.code.oauth_callback is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No oauth_callback defined",
        )

    provider = get_oauth_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider {provider_id} not found",
        )

    if error:
        params = urllib.parse.urlencode(
            {
                "error": error,
            }
        )
        response = RedirectResponse(
            # FIXME: redirect to the right frontend base url to improve the dev environment
            url=f"/login?{params}",
        )
        return response

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing code",
        )

    url = get_user_facing_url(request.url)
    token = await provider.get_token(code, url)

    (raw_user_data, default_user) = await provider.get_user_info(token)

    user = await config.code.oauth_callback(
        provider_id, token, raw_user_data, default_user, id_token
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    access_token = create_jwt(user)

    if data_layer := get_data_layer():
        try:
            await data_layer.create_user(user)
        except Exception as e:
            logger.error(f"Error creating user: {e}")

    params = urllib.parse.urlencode(
        {
            "access_token": access_token,
            "token_type": "bearer",
        }
    )

    root_path = os.environ.get("CHAINLIT_ROOT_PATH", "")

    response = RedirectResponse(
        # FIXME: redirect to the right frontend base url to improve the dev environment
        url=f"{root_path}/login/callback?{params}",
        status_code=302,
    )
    response.delete_cookie("oauth_state")
    return response


_language_pattern = (
    "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?(-[a-zA-Z]{2,8})?(-x-[a-zA-Z0-9]{1,8})?$"
)


@router.get("/project/translations")
async def project_translations(
    language: str = Query(
        default="en-US", description="Language code", pattern=_language_pattern
    ),
):
    """Return project translations."""

    # Load translation based on the provided language
    translation = config.load_translation(language)

    return JSONResponse(
        content={
            "translation": translation,
        }
    )


@router.get("/project/settings")
async def project_settings(
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
    language: str = Query(
        default="en-US", description="Language code", pattern=_language_pattern
    ),
):
    """Return project settings. This is called by the UI before the establishing the websocket connection."""

    # Load the markdown file based on the provided language

    markdown = get_markdown_str(config.root, language)

    profiles = []
    if config.code.set_chat_profiles:
        chat_profiles = await config.code.set_chat_profiles(current_user)
        if chat_profiles:
            profiles = [p.to_dict() for p in chat_profiles]

    starters = []
    if config.code.set_starters:
        starters = await config.code.set_starters(current_user)
        if starters:
            starters = [s.to_dict() for s in starters]

    if config.code.on_audio_chunk:
        config.features.audio.enabled = True

    debug_url = None
    data_layer = get_data_layer()

    if data_layer and config.run.debug:
        debug_url = await data_layer.build_debug_url()

    return JSONResponse(
        content={
            "ui": config.ui.to_dict(),
            "features": config.features.to_dict(),
            "userEnv": config.project.user_env,
            "dataPersistence": get_data_layer() is not None,
            "threadResumable": bool(config.code.on_chat_resume),
            "markdown": markdown,
            "chatProfiles": profiles,
            "starters": starters,
            "debugUrl": debug_url,
        }
    )


@router.put("/feedback")
async def update_feedback(
    request: Request,
    update: UpdateFeedbackRequest,
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
):
    """Update the human feedback for a particular message."""
    data_layer = get_data_layer()
    if not data_layer:
        raise HTTPException(status_code=500, detail="Data persistence is not enabled")

    try:
        feedback_id = await data_layer.upsert_feedback(feedback=update.feedback)
    except Exception as e:
        raise HTTPException(detail=str(e), status_code=500)

    return JSONResponse(content={"success": True, "feedbackId": feedback_id})


@router.delete("/feedback")
async def delete_feedback(
    request: Request,
    payload: DeleteFeedbackRequest,
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
):
    """Delete a feedback."""

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    feedback_id = payload.feedbackId

    await data_layer.delete_feedback(feedback_id)
    return JSONResponse(content={"success": True})


@router.post("/project/threads")
async def get_user_threads(
    request: Request,
    payload: GetThreadsRequest,
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
):
    """Get the threads page by page."""

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    if not isinstance(current_user, PersistedUser):
        persisted_user = await data_layer.get_user(identifier=current_user.identifier)
        if not persisted_user:
            raise HTTPException(status_code=404, detail="User not found")
        payload.filter.userId = persisted_user.id
    else:
        payload.filter.userId = current_user.id

    res = await data_layer.list_threads(payload.pagination, payload.filter)
    return JSONResponse(content=res.to_dict())


@router.get("/project/thread/{thread_id}")
async def get_thread(
    request: Request,
    thread_id: str,
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
):
    """Get a specific thread."""
    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    await is_thread_author(current_user.identifier, thread_id)

    res = await data_layer.get_thread(thread_id)
    return JSONResponse(content=res)


@router.get("/project/thread/{thread_id}/element/{element_id}")
async def get_thread_element(
    request: Request,
    thread_id: str,
    element_id: str,
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
):
    """Get a specific thread element."""
    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    await is_thread_author(current_user.identifier, thread_id)

    res = await data_layer.get_element(thread_id, element_id)
    return JSONResponse(content=res)


@router.delete("/project/thread")
async def delete_thread(
    request: Request,
    payload: DeleteThreadRequest,
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
):
    """Delete a thread."""

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    thread_id = payload.threadId

    await is_thread_author(current_user.identifier, thread_id)

    await data_layer.delete_thread(thread_id)
    return JSONResponse(content={"success": True})


@router.post("/project/file")
async def upload_file(
    session_id: str,
    file: UploadFile,
    current_user: Annotated[
        Union[None, User, PersistedUser], Depends(get_current_user)
    ],
):
    """Upload a file to the session files directory."""

    from chainlit.session import WebsocketSession

    session = WebsocketSession.get_by_id(session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if current_user:
        if not session.user or session.user.identifier != current_user.identifier:
            raise HTTPException(
                status_code=401,
                detail="You are not authorized to upload files for this session",
            )

    session.files_dir.mkdir(exist_ok=True)

    content = await file.read()

    file_response = await session.persist_file(
        name=file.filename, content=content, mime=file.content_type
    )

    return JSONResponse(file_response)


@router.get("/project/file/{file_id}")
async def get_file(
    file_id: str,
    session_id: Optional[str] = None,
):
    """Get a file from the session files directory."""

    from chainlit.session import WebsocketSession

    session = WebsocketSession.get_by_id(session_id) if session_id else None

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if file_id in session.files:
        file = session.files[file_id]
        return FileResponse(file["path"], media_type=file["type"])
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/files/{filename:path}")
async def serve_file(
    filename: str,
    current_user: Annotated[Union[User, PersistedUser], Depends(get_current_user)],
):
    """Serve a file from the local filesystem."""

    base_path = Path(config.project.local_fs_path).resolve()
    file_path = (base_path / filename).resolve()

    if not is_path_inside(file_path, base_path):
        raise HTTPException(status_code=400, detail="Invalid filename")

    if file_path.is_file():
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/favicon")
async def get_favicon():
    """Get the favicon for the UI."""
    custom_favicon_path = os.path.join(APP_ROOT, "public", "favicon.*")
    files = glob.glob(custom_favicon_path)

    if files:
        favicon_path = files[0]
    else:
        favicon_path = os.path.join(build_dir, "favicon.svg")

    media_type, _ = mimetypes.guess_type(favicon_path)

    return FileResponse(favicon_path, media_type=media_type)


@router.get("/logo")
async def get_logo(theme: Optional[Theme] = Query(Theme.light)):
    """Get the default logo for the UI."""
    theme_value = theme.value if theme else Theme.light.value
    logo_path = None

    for path in [
        os.path.join(APP_ROOT, "public", f"logo_{theme_value}.*"),
        os.path.join(build_dir, "assets", f"logo_{theme_value}*.*"),
    ]:
        files = glob.glob(path)

        if files:
            logo_path = files[0]
            break

    if not logo_path:
        raise HTTPException(status_code=404, detail="Missing default logo")

    media_type, _ = mimetypes.guess_type(logo_path)

    return FileResponse(logo_path, media_type=media_type)


@router.get("/avatars/{avatar_id:str}")
async def get_avatar(avatar_id: str):
    """Get the avatar for the user based on the avatar_id."""
    if not re.match(r"^[a-zA-Z0-9_-]+$", avatar_id):
        raise HTTPException(status_code=400, detail="Invalid avatar_id")

    if avatar_id == "default":
        avatar_id = config.ui.name

    avatar_id = avatar_id.strip().lower().replace(" ", "_")

    base_path = Path(APP_ROOT) / "public" / "avatars"
    avatar_pattern = f"{avatar_id}.*"

    matching_files = base_path.glob(avatar_pattern)

    if avatar_path := next(matching_files, None):
        if not is_path_inside(avatar_path, base_path):
            raise HTTPException(status_code=400, detail="Invalid filename")

        media_type, _ = mimetypes.guess_type(str(avatar_path))

        return FileResponse(avatar_path, media_type=media_type)

    return await get_favicon()


@router.head("/")
def status_check():
    """Check if the site is operational."""
    return {"message": "Site is operational"}


@router.get("/{full_path:path}")
async def serve():
    html_template = get_html_template()
    """Serve the UI files."""
    response = HTMLResponse(content=html_template, status_code=200)

    return response


app.include_router(router)

import chainlit.socket  # noqa
