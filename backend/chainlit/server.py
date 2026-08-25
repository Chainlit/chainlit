import asyncio
import fnmatch
import glob
import json
import mimetypes
import os
import re
import shutil
import urllib.parse
import webbrowser
from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path
from typing import TYPE_CHECKING, Dict, List, Optional, Union, cast

import socketio
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
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from starlette.datastructures import URL
from starlette.middleware.cors import CORSMiddleware
from starlette.types import Receive, Scope, Send
from typing_extensions import Annotated
from watchfiles import awatch

from chainlit.auth import create_jwt, decode_jwt, get_configuration, get_current_user
from chainlit.auth.cookie import (
    clear_auth_cookie,
    clear_oauth_state_cookie,
    set_auth_cookie,
    set_oauth_state_cookie,
    validate_oauth_state_cookie,
)
from chainlit.config import (
    APP_ROOT,
    BACKEND_ROOT,
    DEFAULT_HOST,
    FILES_DIRECTORY,
    PACKAGE_ROOT,
    ChainlitConfig,
    config,
    load_module,
    public_dir,
    reload_config,
)
from chainlit.data import get_data_layer
from chainlit.data.acl import is_thread_author
from chainlit.logger import logger
from chainlit.markdown import get_markdown_str
from chainlit.oauth_providers import get_oauth_provider
from chainlit.secret import random_secret
from chainlit.types import (
    AskFileSpec,
    CallActionRequest,
    ConnectMCPRequest,
    DeleteFeedbackRequest,
    DeleteThreadRequest,
    DisconnectMCPRequest,
    ElementRequest,
    GetThreadsRequest,
    ShareThreadRequest,
    Theme,
    UpdateFeedbackRequest,
    UpdateThreadRequest,
)
from chainlit.user import PersistedUser, User
from chainlit.utils import utc_now

from ._utils import is_path_inside

if TYPE_CHECKING:
    from chainlit.element import CustomElement, ElementDict

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Context manager to handle app start and shutdown."""
    if config.code.on_app_startup:
        await config.code.on_app_startup()

    host = config.run.host
    port = config.run.port
    root_path = os.getenv("CHAINLIT_ROOT_PATH", "")
    scheme = "https" if config.run.ssl_cert else "http"

    if host == DEFAULT_HOST:
        url = f"{scheme}://localhost:{port}{root_path}"
    else:
        url = f"{scheme}://{host}:{port}{root_path}"

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

    slack_task = None

    # Slack Socket Handler if env variable SLACK_WEBSOCKET_TOKEN is set
    if os.environ.get("SLACK_BOT_TOKEN") and os.environ.get("SLACK_WEBSOCKET_TOKEN"):
        from chainlit.slack.app import start_socket_mode

        slack_task = asyncio.create_task(start_socket_mode())

    try:
        yield
    finally:
        try:
            if config.code.on_app_shutdown:
                await config.code.on_app_shutdown()

            if watch_task:
                stop_event.set()
                watch_task.cancel()
                await watch_task

            if discord_task:
                discord_task.cancel()
                await discord_task

            if slack_task:
                slack_task.cancel()
                await slack_task

            if data_layer := get_data_layer():
                await data_layer.close()
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

asgi_app = socketio.ASGIApp(socketio_server=sio, socketio_path="")

# config.run.root_path is only set when started with --root-path. Not on submounts.
SOCKET_IO_PATH = f"{config.run.root_path}/ws/socket.io"
app.mount(SOCKET_IO_PATH, asgi_app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.project.allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SafariWebSocketsCompatibleGZipMiddleware(GZipMiddleware):
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        # Prevent gzip compression for HTTP requests to socket.io path due to a bug in Safari
        if URL(scope=scope).path.startswith(SOCKET_IO_PATH):
            await self.app(scope, receive, send)
        else:
            await super().__call__(scope, receive, send)


app.add_middleware(SafariWebSocketsCompatibleGZipMiddleware)

# config.run.root_path is only set when started with --root-path. Not on submounts.
router = APIRouter(prefix=config.run.root_path)


@router.get("/public/{filename:path}")
async def serve_public_file(
    filename: str,
):
    """Serve a file from public dir."""

    base_path = Path(public_dir)
    file_path = (base_path / filename).resolve()

    if not is_path_inside(file_path, base_path):
        raise HTTPException(status_code=400, detail="Invalid filename")

    if file_path.is_file():
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/assets/{filename:path}")
async def serve_asset_file(
    filename: str,
):
    """Serve a file from assets dir."""

    base_path = Path(os.path.join(build_dir, "assets"))
    file_path = (base_path / filename).resolve()

    if not is_path_inside(file_path, base_path):
        raise HTTPException(status_code=400, detail="Invalid filename")

    if file_path.is_file():
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/copilot/{filename:path}")
async def serve_copilot_file(
    filename: str,
):
    """Serve a file from assets dir."""

    base_path = Path(copilot_build_dir)
    file_path = (base_path / filename).resolve()

    if not is_path_inside(file_path, base_path):
        raise HTTPException(status_code=400, detail="Invalid filename")

    if file_path.is_file():
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")


# -------------------------------------------------------------------------------
#                               SLACK HTTP HANDLER
# -------------------------------------------------------------------------------

if (
    os.environ.get("SLACK_BOT_TOKEN")
    and os.environ.get("SLACK_SIGNING_SECRET")
    and not os.environ.get("SLACK_WEBSOCKET_TOKEN")
):
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


def get_html_template(root_path):
    """
    Get HTML template for the index view.
    """
    root_path = root_path.rstrip("/")  # Avoid duplicated / when joining with root path.

    custom_theme = None
    custom_theme_file_path = Path(public_dir) / "theme.json"
    if (
        is_path_inside(custom_theme_file_path, Path(public_dir))
        and custom_theme_file_path.is_file()
    ):
        custom_theme = json.loads(custom_theme_file_path.read_text(encoding="utf-8"))

    PLACEHOLDER = "<!-- TAG INJECTION PLACEHOLDER -->"
    JS_PLACEHOLDER = "<!-- JS INJECTION PLACEHOLDER -->"
    CSS_PLACEHOLDER = "<!-- CSS INJECTION PLACEHOLDER -->"

    default_url = config.ui.custom_meta_url or "https://github.com/Chainlit/chainlit"
    default_meta_image_url = (
        "https://chainlit-cloud.s3.eu-west-3.amazonaws.com/logo/chainlit_banner.png"
    )
    meta_image_url = config.ui.custom_meta_image_url or default_meta_image_url
    favicon_path = "/favicon"

    tags = f"""<title>{config.ui.name}</title>
    <link rel="icon" href="{favicon_path}" />
    <meta name="description" content="{config.ui.description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{config.ui.name}">
    <meta property="og:description" content="{config.ui.description}">
    <meta property="og:image" content="{meta_image_url}">
    <meta property="og:url" content="{default_url}">
    <meta property="og:root_path" content="{root_path}">"""

    js = f"""<script>
{f"window.theme = {json.dumps(custom_theme.get('variables'))};" if custom_theme and custom_theme.get("variables") else "undefined"}
{f"window.transports = {json.dumps(config.project.transports)};" if config.project.transports else "undefined"}
</script>"""

    css = None
    if config.ui.custom_css:
        css = f"""<link rel="stylesheet" type="text/css" href="{config.ui.custom_css}" {config.ui.custom_css_attributes}>"""

    if config.ui.custom_js:
        js += f"""<script src="{config.ui.custom_js}" {config.ui.custom_js_attributes}></script>"""

    font = None
    if custom_theme and "custom_fonts" in custom_theme:
        font = "\n".join(
            f"""<link rel="stylesheet" href="{f}">"""
            for f in custom_theme["custom_fonts"]
        )

    index_html_file_path = os.path.join(build_dir, "index.html")

    with open(index_html_file_path, encoding="utf-8") as f:
        content = f.read()
        content = content.replace(PLACEHOLDER, tags)
        if js:
            content = content.replace(JS_PLACEHOLDER, js)
        if css:
            content = content.replace(CSS_PLACEHOLDER, css)
        if font is not None:
            content = replace_between_tags(
                content, "<!-- FONT START -->", "<!-- FONT END -->", font
            )
        content = content.replace('href="/', f'href="{root_path}/')
        content = content.replace('src="/', f'src="{root_path}/')
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


def _get_response_dict(access_token: str) -> dict:
    """Get the response dictionary for the auth response."""

    return {"success": True}


def _get_auth_response(access_token: str, redirect_to_callback: bool) -> Response:
    """Get the redirect params for the OAuth callback."""

    response_dict = _get_response_dict(access_token)

    if redirect_to_callback:
        root_path = os.environ.get("CHAINLIT_ROOT_PATH", "")
        root_path = "" if root_path == "/" else root_path
        redirect_url = (
            f"{root_path}/login/callback?{urllib.parse.urlencode(response_dict)}"
        )

        return RedirectResponse(
            # FIXME: redirect to the right frontend base url to improve the dev environment
            url=redirect_url,
            status_code=302,
        )

    return JSONResponse(response_dict)


def _get_oauth_redirect_error(
    request: Request, error: str, status_code: int = 302
) -> Response:
    """Get the redirect response for an OAuth error."""
    params = urllib.parse.urlencode(
        {
            "error": error,
        }
    )
    response = RedirectResponse(
        url=str(request.url_for("login")) + "?" + params,
        status_code=status_code,
    )
    return response


async def _authenticate_user(
    request: Request, user: Optional[User], redirect_to_callback: bool = False
) -> Response:
    """Authenticate a user and return the response."""

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="credentialssignin",
        )

    # If a data layer is defined, attempt to persist user.
    if data_layer := get_data_layer():
        try:
            await data_layer.create_user(user)
        except Exception as e:
            # Catch and log exceptions during user creation.
            # TODO: Make this catch only specific errors and allow others to propagate.
            logger.error(f"Error creating user: {e}")

    access_token = create_jwt(user)

    response = _get_auth_response(access_token, redirect_to_callback)

    set_auth_cookie(request, response, access_token)

    return response


@router.post("/login")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
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

    return await _authenticate_user(request, user)


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout the user by calling the on_logout callback."""
    clear_auth_cookie(request, response)

    if config.code.on_logout:
        return await config.code.on_logout(request, response)

    return {"success": True}


@router.post("/auth/jwt")
async def jwt_auth(request: Request):
    """Login a user using a valid jwt."""
    from jwt import InvalidTokenError

    auth_header: Optional[str] = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    # Check if it starts with "Bearer "
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication scheme. Please use Bearer",
            )
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )

    try:
        user = decode_jwt(token)
        return await _authenticate_user(request, user)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/auth/header")
async def header_auth(request: Request):
    """Login a user using the header_auth_callback."""
    if not config.code.header_auth_callback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No header_auth_callback defined",
        )

    user = await config.code.header_auth_callback(request.headers)

    return await _authenticate_user(request, user)


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

    set_oauth_state_cookie(response, random)

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
        logger.warning("OAuth provider %s returned error: %s", provider_id, error)
        return _get_oauth_redirect_error(request, "oauthSignin")

    if not code or not state:
        return _get_oauth_redirect_error(request, "oauthSignin")

    try:
        validate_oauth_state_cookie(request, state)
    except Exception as e:
        logger.warning("Unable to validate oauth state: %s", e, exc_info=True)
        return _get_oauth_redirect_error(request, "oauthSignin")

    url = get_user_facing_url(request.url)
    try:
        token = await provider.get_token(code, url)
        (raw_user_data, default_user) = await provider.get_user_info(token)
        user = await config.code.oauth_callback(
            provider_id, token, raw_user_data, default_user
        )
    except asyncio.CancelledError:
        raise
    except Exception as e:
        logger.exception("OAuth callback error: %s", e)
        return _get_oauth_redirect_error(request, "oauthSignin")

    if not user:
        return _get_oauth_redirect_error(request, "oauthSignin")

    response = await _authenticate_user(request, user, redirect_to_callback=True)

    clear_oauth_state_cookie(response)

    return response


# specific route for azure ad hybrid flow
@router.post("/auth/oauth/azure-ad-hybrid/callback")
async def oauth_azure_hf_callback(
    request: Request,
    error: Optional[str] = None,
    form_error: Annotated[Optional[str], Form(alias="error")] = None,
    code: Annotated[Optional[str], Form()] = None,
    id_token: Annotated[Optional[str], Form()] = None,
):
    """Handle the azure ad hybrid flow callback and login the user."""

    # This provider uses response_mode=form_post, so the provider posts `error`
    # as a form field. Keep accepting it as a query param for backward compat.
    error = error or form_error

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
        logger.warning("OAuth provider %s returned error: %s", provider_id, error)
        return _get_oauth_redirect_error(request, "oauthSignin", status_code=303)

    if not code:
        return _get_oauth_redirect_error(request, "oauthSignin", status_code=303)

    url = get_user_facing_url(request.url)
    try:
        token = await provider.get_token(code, url)
        (raw_user_data, default_user) = await provider.get_user_info(token)
        user = await config.code.oauth_callback(
            provider_id, token, raw_user_data, default_user, id_token
        )
    except asyncio.CancelledError:
        raise
    except Exception as e:
        logger.exception("OAuth callback error: %s", e)
        return _get_oauth_redirect_error(request, "oauthSignin", status_code=303)

    if not user:
        return _get_oauth_redirect_error(request, "oauthSignin", status_code=303)

    response = await _authenticate_user(request, user, redirect_to_callback=True)

    clear_oauth_state_cookie(response)

    return response


GenericUser = Union[User, PersistedUser, None]
UserParam = Annotated[GenericUser, Depends(get_current_user)]


@router.get("/user")
async def get_user(current_user: UserParam) -> GenericUser:
    return current_user


_language_pattern = (
    "^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,4})?(-[a-zA-Z0-9]{2,8})?(-x-[a-zA-Z0-9]{1,8})?$"
)


@router.post("/set-session-cookie")
async def set_session_cookie(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")

    is_local = request.client and request.client.host in ["127.0.0.1", "localhost"]

    response.set_cookie(
        key="X-Chainlit-Session-id",
        value=session_id,
        path="/",
        httponly=True,
        secure=not is_local,
        samesite="lax" if is_local else "none",
    )

    return {"message": "Session cookie set"}


@router.get("/project/translations")
async def project_translations(
    language: str = Query(
        default="en-US", description="Language code", pattern=_language_pattern
    ),
):
    """Return project translations."""

    # Use configured language if set, otherwise use the language from query
    effective_language = config.ui.language or language

    # Load translation based on the effective language
    translation = config.load_translation(effective_language)

    return JSONResponse(
        content={
            "translation": translation,
        }
    )


@router.get("/project/settings")
async def project_settings(
    current_user: UserParam,
    language: str = Query(
        default="en-US", description="Language code", pattern=_language_pattern
    ),
    chat_profile: Optional[str] = Query(
        default=None, description="Current chat profile name"
    ),
):
    """Return project settings. This is called by the UI before the establishing the websocket connection."""

    # Use configured language if set, otherwise use the language from query
    effective_language = config.ui.language or language

    # Load the markdown file based on the provided language
    markdown = get_markdown_str(config.root, effective_language)

    chat_profiles = []
    profiles: list[dict] = []
    if config.code.set_chat_profiles:
        chat_profiles = await config.code.set_chat_profiles(
            current_user, effective_language
        )
        if chat_profiles:
            for p in chat_profiles:
                d = p.to_dict()
                d.pop("config_overrides", None)
                profiles.append(d)

    starters = []
    if config.code.set_starters:
        s = await config.code.set_starters(current_user, effective_language)
        if s:
            starters = [it.to_dict() for it in s]

    starter_categories = []
    if config.code.set_starter_categories:
        sc = await config.code.set_starter_categories(
            current_user, effective_language, chat_profile
        )
        if sc:
            starter_categories = [it.to_dict() for it in sc]

    data_layer = get_data_layer()
    debug_url = (
        await data_layer.build_debug_url() if data_layer and config.run.debug else None
    )

    cfg = config
    if chat_profile and chat_profiles:
        current_profile = next(
            (p for p in chat_profiles if p.name == chat_profile), None
        )
        if current_profile and getattr(current_profile, "config_overrides", None):
            cfg = config.with_overrides(current_profile.config_overrides)

    features_dict = cfg.features.model_dump()
    # Strip sensitive details from MCP server configs — only expose name and type to clients
    if "mcp" in features_dict and isinstance(features_dict["mcp"].get("servers"), list):
        features_dict["mcp"]["servers"] = [
            {"name": s.name, "type": s.type} for s in cfg.features.mcp.servers
        ]
    # Don't leak the SSRF allowlist (allowed_urls) to the browser — clients only need
    # to know whether user-provided servers are enabled.
    if "mcp" in features_dict and isinstance(
        features_dict["mcp"].get("user_servers"), dict
    ):
        features_dict["mcp"]["user_servers"] = {
            "enabled": features_dict["mcp"]["user_servers"].get("enabled", False)
        }
    return JSONResponse(
        content={
            "ui": cfg.ui.model_dump(),
            "features": features_dict,
            "userEnv": cfg.project.user_env,
            "maskUserEnv": cfg.project.mask_user_env,
            "dataPersistence": data_layer is not None,
            "threadResumable": bool(config.code.on_chat_resume),
            # Expose whether shared threads feature is enabled (flag + app callback)
            "threadSharing": bool(
                getattr(cfg.features, "allow_thread_sharing", False)
                and getattr(config.code, "on_shared_thread_view", None)
            ),
            "markdown": markdown,
            "chatProfiles": profiles,
            "starters": starters,
            "starterCategories": starter_categories,
            "debugUrl": debug_url,
        }
    )


@router.put("/feedback")
async def update_feedback(
    request: Request,
    update: UpdateFeedbackRequest,
    current_user: UserParam,
):
    """Update the human feedback for a particular message."""
    data_layer = get_data_layer()
    if not data_layer:
        raise HTTPException(status_code=500, detail="Data persistence is not enabled")

    try:
        feedback_id = await data_layer.upsert_feedback(feedback=update.feedback)

        if config.code.on_feedback:
            try:
                from chainlit.context import init_ws_context
                from chainlit.session import WebsocketSession

                session = WebsocketSession.get_by_id(update.sessionId)
                init_ws_context(session)

                await config.code.on_feedback(update.feedback)
            except Exception as callback_error:
                logger.error(
                    f"Error in user-provided on_feedback callback: {callback_error}"
                )
                # Optionally, you could continue without raising an exception to avoid disrupting the endpoint.
    except Exception as e:
        raise HTTPException(detail=str(e), status_code=500) from e

    return JSONResponse(content={"success": True, "feedbackId": feedback_id})


@router.delete("/feedback")
async def delete_feedback(
    request: Request,
    payload: DeleteFeedbackRequest,
    current_user: UserParam,
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
    current_user: UserParam,
):
    """Get the threads page by page."""

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

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
    current_user: UserParam,
):
    """Get a specific thread."""
    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    await is_thread_author(current_user.identifier, thread_id)

    res = await data_layer.get_thread(thread_id)
    return JSONResponse(content=res)


@router.get("/project/share/{thread_id}")
async def get_shared_thread(
    request: Request,
    thread_id: str,
    current_user: UserParam,
):
    """Get a shared thread (read-only for everyone).

    This endpoint is separate from the resume endpoint and does not require the caller
    to be the author of the thread. It only returns the thread if its metadata
    contains is_shared=True. Otherwise, it returns 404 to avoid leaking existence.
    """

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    # No auth required: allow anonymous access to shared threads
    thread = await data_layer.get_thread(thread_id)

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    # Extract and normalize metadata (may be dict, strified JSON, or None)
    metadata = (thread.get("metadata") if isinstance(thread, dict) else {}) or {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except Exception:
            metadata = {}
    if not isinstance(metadata, dict):
        metadata = {}

    user_can_view = False
    if getattr(config.code, "on_shared_thread_view", None):
        try:
            user_can_view = await config.code.on_shared_thread_view(
                thread, current_user
            )
        except Exception:
            user_can_view = False

    is_shared = bool(metadata.get("is_shared"))

    # Proceed only raise an error if both conditions are False.
    if (not user_can_view) and (not is_shared):
        raise HTTPException(status_code=404, detail="Thread not found")

    metadata.pop("chat_profile", None)
    metadata.pop("chat_settings", None)
    metadata.pop("env", None)
    thread["metadata"] = metadata
    return JSONResponse(content=thread)


@router.get("/project/thread/{thread_id}/element/{element_id}")
async def get_thread_element(
    request: Request,
    thread_id: str,
    element_id: str,
    current_user: UserParam,
):
    """Get a specific thread element."""
    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    await is_thread_author(current_user.identifier, thread_id)

    res = await data_layer.get_element(thread_id, element_id)
    return JSONResponse(content=res)


@router.put("/project/element")
async def update_thread_element(
    payload: ElementRequest,
    current_user: UserParam,
):
    """Update a specific thread element."""

    from chainlit.context import init_ws_context
    from chainlit.element import ElementDict
    from chainlit.session import WebsocketSession

    session = WebsocketSession.get_by_id(payload.sessionId)
    context = init_ws_context(session)

    element_dict = cast(ElementDict, payload.element)

    if element_dict["type"] != "custom":
        return {"success": False}

    element = _sanitize_custom_element(element_dict)

    if current_user:
        if (
            not context.session.user
            or context.session.user.identifier != current_user.identifier
        ):
            raise HTTPException(
                status_code=401,
                detail="You are not authorized to update elements for this session",
            )

    await element.update()

    return {"success": True}


@router.delete("/project/element")
async def delete_thread_element(
    payload: ElementRequest,
    current_user: UserParam,
):
    """Delete a specific thread element."""

    from chainlit.context import init_ws_context
    from chainlit.element import ElementDict
    from chainlit.session import WebsocketSession

    session = WebsocketSession.get_by_id(payload.sessionId)
    context = init_ws_context(session)

    element_dict = cast(ElementDict, payload.element)

    if element_dict["type"] != "custom":
        return {"success": False}

    element = _sanitize_custom_element(element_dict)

    if current_user:
        if (
            not context.session.user
            or context.session.user.identifier != current_user.identifier
        ):
            raise HTTPException(
                status_code=401,
                detail="You are not authorized to remove elements for this session",
            )

    await element.remove()

    return {"success": True}


def _sanitize_custom_element(element_dict: "ElementDict") -> "CustomElement":
    from chainlit.element import CustomElement

    return CustomElement(
        id=element_dict["id"],
        for_id=element_dict.get("forId") or "",
        thread_id=element_dict.get("threadId") or "",
        name=element_dict["name"],
        props=element_dict.get("props") or {},
        display=element_dict["display"],
    )


@router.put("/project/thread")
async def rename_thread(
    request: Request,
    payload: UpdateThreadRequest,
    current_user: UserParam,
):
    """Rename a thread."""

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    thread_id = payload.threadId

    await is_thread_author(current_user.identifier, thread_id)

    await data_layer.update_thread(thread_id, name=payload.name)

    return JSONResponse(content={"success": True})


@router.put("/project/thread/share")
async def share_thread(
    request: Request,
    payload: ShareThreadRequest,
    current_user: UserParam,
):
    """Share or un-share a thread (author only)."""

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    thread_id = payload.threadId

    await is_thread_author(current_user.identifier, thread_id)

    # Fetch current thread and metadata, then toggle is_shared
    thread = await data_layer.get_thread(thread_id=thread_id)
    metadata = (thread.get("metadata") if thread else {}) or {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except Exception:
            metadata = {}
    if not isinstance(metadata, dict):
        metadata = {}

    metadata = dict(metadata)
    is_shared = bool(payload.isShared)
    metadata["is_shared"] = is_shared
    if is_shared:
        metadata["shared_at"] = utc_now()
    else:
        metadata.pop("shared_at", None)
    try:
        await data_layer.update_thread(thread_id=thread_id, metadata=metadata)
        logger.debug(
            "[share_thread] updated metadata for thread=%s to %s",
            thread_id,
            metadata,
        )
    except Exception as e:
        logger.exception("[share_thread] update_thread failed: %s", e)
        raise

    return JSONResponse(content={"success": True})


@router.delete("/project/thread")
async def delete_thread(
    request: Request,
    payload: DeleteThreadRequest,
    current_user: UserParam,
):
    """Delete a thread."""

    data_layer = get_data_layer()

    if not data_layer:
        raise HTTPException(status_code=400, detail="Data persistence is not enabled")

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    thread_id = payload.threadId

    await is_thread_author(current_user.identifier, thread_id)

    await data_layer.delete_thread(thread_id)
    return JSONResponse(content={"success": True})


@router.post("/project/action")
async def call_action(
    payload: CallActionRequest,
    current_user: UserParam,
):
    """Run an action."""

    from chainlit.action import Action
    from chainlit.context import init_ws_context
    from chainlit.session import WebsocketSession

    session = WebsocketSession.get_by_id(payload.sessionId)
    context = init_ws_context(session)
    config: ChainlitConfig = session.get_config()

    action = Action(**payload.action)

    if current_user:
        if (
            not context.session.user
            or context.session.user.identifier != current_user.identifier
        ):
            raise HTTPException(
                status_code=401,
                detail="You are not authorized to upload files for this session",
            )

    callback = config.code.action_callbacks.get(action.name)
    if callback:
        if not context.session.has_first_interaction:
            context.session.has_first_interaction = True
            asyncio.create_task(context.emitter.init_thread(action.name))

        response = await callback(action)
    else:
        raise HTTPException(
            status_code=404,
            detail=f"No callback found for action {action.name}",
        )

    return JSONResponse(content={"success": True, "response": response})


# `env`'s flags that consume a following value. Short forms take the value
# fused (`-uNAME`, not handled below -- see _find_leading_env_assignment) or
# as the next argument (`-u NAME`); long forms take it fused with `=`
# (`--unset=NAME`) or as the next argument (`--unset NAME`). Only the
# next-argument forms need special handling here: the fused forms already
# read as a single token and are skipped like any other flag.
_ENV_FLAGS_WITH_ARG = {"-u", "--unset", "-C", "--chdir", "-S", "--split-string"}


def _find_leading_env_assignment(parts: List[str]) -> Optional[str]:
    """Return the first `KEY=value`-shaped token before the actual command in
    a shlex-split MCP stdio command, or None if there isn't one.

    Only a bare `env` prefix is unwrapped (`parts[0] == "env"`); any other
    command is inspected only at its first token, matching the plain
    `FOO=bar cmd` case.

    Walks past `env`'s own flags (`-i`, `--ignore-environment`, `-u NAME`,
    `--unset=NAME`, `-C DIR`, `-S STRING`, ...) before looking for the
    assignment, so `env -i FOO=bar cmd` and `env -u OTHER FOO=bar cmd` are
    caught -- a fixed-width lookahead over the first one or two tokens misses
    both, because the flag shifts the assignment further down the argument
    list. A flag consumes one extra token only when it's one of
    `_ENV_FLAGS_WITH_ARG` *and* its value isn't fused on with `=`.

    Deliberately NOT handled: fused short-option values (`-uNAME`), GNU's
    `--split-string` re-splitting semantics, combined short options
    (`-iu NAME`), and a `--` end-of-options marker. None of those are
    realistic in a Chainlit MCP server `command`, and guessing wrong would
    either miss a real assignment or reject a legitimate command. The first
    token that isn't a recognised flag and isn't `KEY=value`-shaped ends the
    scan -- that's the actual command -- so an unrecognised flag can in
    theory cause a later assignment to be missed, same as the original
    fixed-width check did for anything past its lookahead window.
    """
    if not parts:
        return None
    if parts[0] != "env":
        return parts[0] if "=" in parts[0] else None

    idx = 1
    while idx < len(parts):
        part = parts[idx]
        if part.startswith("-") and part != "-":
            flag = part.split("=", 1)[0]
            if flag in _ENV_FLAGS_WITH_ARG and "=" not in part:
                idx += 2  # value is a separate token, e.g. `-u NAME`
            else:
                idx += 1  # value fused in (`--unset=NAME`), or a no-arg flag
            continue
        if "=" in part:
            return part
        break  # first non-flag, non-assignment token is the command itself

    return None


def _unwrap_mcp_error(exc: BaseException) -> BaseException:
    """Return the most informative exception inside exc.

    The SSE / streamable-http transports run their read/write loops in an
    anyio TaskGroup, so failures reach the caller wrapped in an
    (Base)ExceptionGroup. Reporting that verbatim gives the operator
    "unhandled errors in a TaskGroup (1 sub-exception)" and nothing else.

    Prefer our own McpDestinationError, since "the destination was outside
    the allowlist" is the most actionable thing we can say. Failing that,
    peel the group wrappers so the real cause (a connection error, a bad
    status) surfaces instead of the wrapper.
    """
    from chainlit.mcp import McpDestinationError

    seen: set[int] = set()
    stack: list[BaseException] = [exc]
    while stack:
        current = stack.pop()
        if id(current) in seen:
            continue
        seen.add(id(current))
        if isinstance(current, McpDestinationError):
            return current
        sub_exceptions = getattr(current, "exceptions", None)
        if sub_exceptions:
            stack.extend(sub_exceptions)
        if current.__cause__ is not None:
            stack.append(current.__cause__)
        if current.__context__ is not None:
            stack.append(current.__context__)

    # No destination error — unwrap group wrappers to the underlying cause.
    current = exc
    while True:
        sub_exceptions = getattr(current, "exceptions", None)
        if not sub_exceptions:
            break
        current = sub_exceptions[0]
    return current


@router.post("/mcp")
async def connect_mcp(
    payload: ConnectMCPRequest,
    current_user: UserParam,
):
    import asyncio
    import shlex

    from mcp import ClientSession
    from mcp.client.sse import sse_client
    from mcp.client.stdio import (
        StdioServerParameters,
        get_default_environment,
        stdio_client,
    )
    from mcp.client.streamable_http import streamablehttp_client

    from chainlit.config import SseMcpServer, StdioMcpServer, StreamableHttpMcpServer
    from chainlit.context import init_ws_context
    from chainlit.mcp import (
        _MCP_CONNECT_TIMEOUT_HTTP,
        _MCP_CONNECT_TIMEOUT_STDIO,
        HttpMcpConnection,
        McpConnection,
        McpDestinationError,
        McpHttpClientFactory,
        SseMcpConnection,
        StdioMcpConnection,
        _destination_in_allowlist,
        _destination_on_origin,
        make_mcp_http_client_factory,
        validate_mcp_headers,
        validate_mcp_url,
    )
    from chainlit.session import McpSession, WebsocketSession, stop_mcp_task

    session = WebsocketSession.get_by_id(payload.sessionId)
    context = init_ws_context(session)
    config: ChainlitConfig = session.get_config()

    if current_user:
        if (
            not context.session.user
            or context.session.user.identifier != current_user.identifier
        ):
            raise HTTPException(
                status_code=401,
            )

    mcp_enabled = config.features.mcp.enabled
    if not mcp_enabled:
        raise HTTPException(
            status_code=400,
            detail="This app does not support MCP.",
        )

    # Reject user-provided connections that try to claim a configured server's
    # name — must run BEFORE the eviction block below, otherwise a rejected
    # attempt would still have killed the legitimate session.
    # Compared case-insensitively and whitespace-stripped so a near-miss name
    # can't be used to impersonate a configured server in the UI.
    if payload.url is not None and any(
        s.name.strip().casefold() == payload.name.strip().casefold()
        for s in config.features.mcp.servers
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"MCP server name {payload.name!r} is reserved by a configured server "
                "and cannot be used for a user-provided connection."
            ),
        )

    # ── Validate config before launching the background task ──
    #
    # Runs before the eviction block below (moved further down, right
    # before "Store the session"): a reconnect that fails validation, fails
    # to connect, times out, is blocked, or has its on_mcp_connect callback
    # raise must not first kill the working session it was trying to
    # replace. `session.mcp_sessions[name]` is written exactly once, after
    # `on_mcp_connect` succeeds, so no two same-named sessions ever coexist
    # under that key and no tool-name collision or emitter-ordering change
    # results from this reordering.
    mcp_connection: McpConnection
    # Computed once and reused both by the destination-binding httpx factory
    # (below) and the connect-response / error-hygiene branches (below that).
    is_user_provided = payload.url is not None
    # Only set for stdio named servers; merged into the spawn environment in
    # the background runner.
    stdio_env: Optional[Dict[str, str]] = None

    try:
        if payload.url is None:
            # Named server: look it up in developer-configured servers
            server_cfg = next(
                (s for s in config.features.mcp.servers if s.name == payload.name),
                None,
            )
            if server_cfg is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"MCP server {payload.name!r} is not configured. "
                        "Add it to [[features.mcp.servers]] in your .chainlit/config.toml."
                    ),
                )
            if isinstance(server_cfg, StdioMcpServer):
                parts = shlex.split(server_cfg.command, posix=True)
                if not parts:
                    raise ValueError(f"Empty command for MCP server {payload.name!r}")
                # Walk the leading tokens, skipping a bare `env` prefix and any
                # of its flags, so `FOO=bar cmd`, `env FOO=bar cmd`, and
                # `env -i FOO=bar cmd` are all caught. Without this, `-i` (or
                # any other flag consuming a slot before the assignment) would
                # shift `FOO=bar` past a fixed-width lookahead and slip
                # through undetected.
                inline_assignment = _find_leading_env_assignment(parts)
                if inline_assignment:
                    raise ValueError(
                        f"MCP server {payload.name!r} command contains "
                        f"{inline_assignment!r}, which looks like a leftover inline "
                        "environment variable assignment (e.g. "
                        "'KEY=value some-command args'). Move it into the "
                        "server's `env` mapping instead, e.g.: "
                        '[[features.mcp.servers]] ... env = { KEY = "value" }.'
                    )
                mcp_connection = StdioMcpConnection(
                    command=parts[0], args=parts[1:], name=payload.name
                )
                # `env` is optional on StdioMcpServer; getattr keeps this
                # working even for configs predating the field.
                stdio_env = getattr(server_cfg, "env", None)
            elif isinstance(server_cfg, SseMcpServer):
                mcp_connection = SseMcpConnection(
                    url=server_cfg.url,
                    name=payload.name,
                    headers=server_cfg.headers,
                )
            elif isinstance(server_cfg, StreamableHttpMcpServer):
                mcp_connection = HttpMcpConnection(
                    url=server_cfg.url,
                    name=payload.name,
                    headers=server_cfg.headers,
                )
            else:
                raise HTTPException(
                    status_code=500, detail="Unknown server config type"
                )
        else:
            # User-provided server (SSE or streamable-http only; stdio is never user-provided)
            if not config.features.mcp.user_servers.enabled:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "User-provided MCP servers are not enabled. "
                        "Set features.mcp.user_servers.enabled = true in your config."
                    ),
                )
            validate_mcp_url(payload.url, config.features.mcp.user_servers.allowed_urls)
            filtered_headers = validate_mcp_headers(payload.headers)
            if payload.clientType == "sse":
                mcp_connection = SseMcpConnection(
                    url=payload.url,
                    name=payload.name,
                    headers=filtered_headers,
                )
            else:  # streamable-http
                mcp_connection = HttpMcpConnection(
                    url=payload.url,
                    name=payload.name,
                    headers=filtered_headers,
                )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # ── Launch the MCP connection in its own background task ──
    #
    # The background task owns the AsyncExitStack: it enters all context
    # managers, calls initialize(), signals ``ready_event``, and then
    # blocks on ``stop_event.wait()``.  When the stop event fires the
    # task wakes up and closes the exit stack *in the same task* that
    # opened it — avoiding the cross-task cancel-scope corruption from
    # https://github.com/Chainlit/chainlit/issues/2182.

    ready_event: asyncio.Event = asyncio.Event()
    stop_event: asyncio.Event = asyncio.Event()
    # Mutable container to pass the ClientSession (or an error) back from
    # the bg task.
    result_holder: dict[str, object] = {}

    def _record_blocked(exc: McpDestinationError) -> None:
        # Fail-fast side channel: mcp/client/sse.py and
        # mcp/client/streamable_http.py swallow exceptions raised from the
        # httpx request hook (bare ``except Exception: logger.exception``,
        # no re-raise), so a blocked destination would otherwise never
        # reach ``ClientSession.initialize()`` and ``ready_event`` would
        # never be set — hanging the bounded wait below until its timeout.
        # This unblocks it immediately instead.
        if "error" not in result_holder:
            result_holder["error"] = exc
        ready_event.set()

    # ── Bind the destination-checking httpx client factory ──
    #
    # The SSE transport takes its POST target from the server's ``endpoint``
    # event, and the SDK only validates that event's netloc/scheme — not its
    # path. Re-checking every outgoing request against the *right* grant
    # (below) closes that gap; using the wrong grant here would either reopen
    # it (allowlist too broad) or fail conforming servers (origin too
    # narrow), so which check applies depends on whether this is a
    # user-provided or named connection.
    mcp_http_client_factory: Optional[McpHttpClientFactory] = None
    if isinstance(mcp_connection, (SseMcpConnection, HttpMcpConnection)):
        if is_user_provided:
            mcp_http_client_factory = make_mcp_http_client_factory(
                _destination_in_allowlist(
                    config.features.mcp.user_servers.allowed_urls
                ),
                on_blocked=_record_blocked,
            )
        else:
            mcp_http_client_factory = make_mcp_http_client_factory(
                _destination_on_origin(mcp_connection.url),
                on_blocked=_record_blocked,
            )

    async def _mcp_session_runner() -> None:
        exit_stack = AsyncExitStack()
        try:
            try:
                if isinstance(mcp_connection, SseMcpConnection):
                    # Set above for every SSE/HTTP connection; stdio is the only
                    # transport without one.
                    assert mcp_http_client_factory is not None
                    transport = await exit_stack.enter_async_context(
                        sse_client(
                            url=mcp_connection.url,
                            headers=mcp_connection.headers,
                            httpx_client_factory=mcp_http_client_factory,
                        )
                    )
                elif isinstance(mcp_connection, StdioMcpConnection):
                    spawn_env = get_default_environment()
                    if stdio_env:
                        spawn_env.update(stdio_env)
                    transport = await exit_stack.enter_async_context(
                        stdio_client(
                            StdioServerParameters(
                                command=mcp_connection.command,
                                args=mcp_connection.args,
                                env=spawn_env,
                            )
                        )
                    )
                elif isinstance(mcp_connection, HttpMcpConnection):
                    assert mcp_http_client_factory is not None
                    # NOTE: streamablehttp_client is deprecated from mcp 1.24.0
                    # (renamed streamable_http_client, taking http_client= instead
                    # of a factory) and removed in 2.0.0 — update this on bump.
                    transport = await exit_stack.enter_async_context(
                        streamablehttp_client(
                            url=mcp_connection.url,
                            headers=mcp_connection.headers,
                            httpx_client_factory=mcp_http_client_factory,
                        )
                    )
                else:
                    raise ValueError(
                        f"Unknown client type: {mcp_connection.clientType}"
                    )

                read, write = transport[:2]

                mcp_client: ClientSession = await exit_stack.enter_async_context(
                    ClientSession(
                        read_stream=read,
                        write_stream=write,
                        sampling_callback=None,
                    )
                )

                await mcp_client.initialize()
                result_holder["client"] = mcp_client

            except BaseException as exc:
                # First error wins. The caller may already have recorded the
                # *causal* failure — a blocked destination (_record_blocked)
                # or the synthesized connect timeout — and then cancelled us
                # to unstick ``initialize()``. The resulting CancelledError
                # arrives here second and carries no message, so overwriting
                # would replace the real reason with a blank one: the user
                # would see "Could not connect to the MCP: " and, for a named
                # server, the operator log (the only place the cause is
                # recorded) would lose the blocked destination entirely.
                if "error" not in result_holder:
                    result_holder["error"] = _unwrap_mcp_error(exc)
                return  # outer finally closes exit_stack
            finally:
                # Always signal the caller so it doesn't wait forever.
                ready_event.set()

            # ── Keep the task (and the exit stack) alive ──
            try:
                await stop_event.wait()
            except asyncio.CancelledError:
                logger.debug("MCP background task for %r cancelled", payload.name)
        finally:
            # Close exit_stack in ALL paths (error, normal shutdown,
            # cancellation) — always in the same task that opened it.
            logger.debug("Closing MCP exit stack for %r (same-task)", payload.name)
            try:
                await exit_stack.aclose()
            except BaseException:
                logger.debug(
                    "Error closing MCP exit stack for %r",
                    payload.name,
                    exc_info=True,
                )

    task = asyncio.create_task(
        _mcp_session_runner(), name=f"mcp-session-{payload.name}"
    )

    # Wait for the background task to finish initialisation, bounded so a
    # blocked destination (swallowed by the SDK — see _record_blocked above)
    # or a slow/hanging transport can't hang the request (and its task)
    # forever. Stdio gets a much longer budget: `npx -y ...` can cold-
    # download a package on first run.
    connect_timeout = (
        _MCP_CONNECT_TIMEOUT_STDIO
        if isinstance(mcp_connection, StdioMcpConnection)
        else _MCP_CONNECT_TIMEOUT_HTTP
    )
    try:
        await asyncio.wait_for(ready_event.wait(), timeout=connect_timeout)
    except asyncio.TimeoutError:
        pass
    if "error" not in result_holder and "client" not in result_holder:
        result_holder["error"] = asyncio.TimeoutError(
            f"Timed out after {connect_timeout:.0f}s waiting for the MCP "
            "connection to initialize."
        )

    if "error" in result_holder:
        # Always route through stop_mcp_task rather than a bare ``await
        # task`` — the discriminator is "is the task done", not "did the
        # wait raise": on the timeout/blocked paths the runner may still be
        # sitting inside ``initialize()``, and stop_mcp_task's bounded
        # wait-then-cancel unsticks that (and closes a latent unbounded
        # hang if ``exit_stack.aclose()`` itself stalls).
        await stop_mcp_task(task, stop_event, payload.name)
        connect_error = cast(BaseException, result_holder["error"])
        if is_user_provided:
            # The client already supplied this URL, so echoing the failure
            # detail back is useful and leaks nothing new.
            detail = f"Could not connect to the MCP: {connect_error!s}"
        else:
            # Named servers are developer config and may embed secrets in
            # userinfo or query params — httpx errors routinely include the
            # request URL in their string form, so never return it verbatim.
            logger.error(
                "Failed to connect to MCP server %r",
                payload.name,
                exc_info=connect_error,
            )
            detail = (
                "Could not connect to the MCP server. Check the server logs "
                "for details."
            )
        return JSONResponse(
            status_code=400,
            content={"detail": detail},
        )

    mcp_client_session = cast("ClientSession", result_holder["client"])

    # Call the user callback
    if config.code.on_mcp_connect:
        try:
            await config.code.on_mcp_connect(mcp_connection, mcp_client_session)
        except Exception as e:
            # Callback failed — tear down the connection.
            await stop_mcp_task(task, stop_event, payload.name)
            if is_user_provided:
                detail = f"Could not connect to the MCP: {e!s}"
            else:
                logger.error(
                    "on_mcp_connect callback failed for MCP server %r",
                    payload.name,
                    exc_info=e,
                )
                detail = (
                    "Could not connect to the MCP server. Check the server "
                    "logs for details."
                )
            return JSONResponse(
                status_code=400,
                content={"detail": detail},
            )

    # Disconnect previous session for this name (reconnection). Runs only
    # now that on_mcp_connect has succeeded — a reconnect that failed for
    # any reason above (bad creds, server down, blocked destination,
    # timeout, a rejecting callback) leaves the old working session intact
    # instead of evicting it before knowing the replacement would work.
    # Trade-off: if the old session was already silently dead, it keeps
    # showing "connected" until this succeeds — pre-existing (McpSession has
    # no liveness probe), not made worse here.
    #
    # The check-then-store step itself must be atomic: two concurrent
    # reconnects for the same name can both reach here around the same
    # time, and if the dict pop and the dict store are separated by an
    # `await` (as they used to be -- on_mcp_disconnect / old session close
    # sat in between), a second request can see the name already popped by
    # the first, skip eviction, and store its own session -- only for the
    # first request to then resume and unconditionally overwrite it,
    # orphaning the second session's background task forever (never
    # reachable from mcp_sessions again, so even WebsocketSession.delete()
    # can't close it). swap_mcp_session does the pop+store as a single
    # `await`-free step, so no other coroutine can ever observe (or act on)
    # an in-between state where the name is briefly absent -- it's atomic
    # under asyncio's cooperative scheduling, no lock needed. Whichever
    # request's swap runs second simply evicts the first request's
    # just-stored session the same way it would evict any other stale one,
    # so a task is always torn down through the normal path below and never
    # silently dropped.
    mcp_session_obj = McpSession(
        name=mcp_connection.name,
        client=mcp_client_session,
        task=task,
        stop_event=stop_event,
    )
    old_mcp = session.swap_mcp_session(mcp_connection.name, mcp_session_obj)
    if old_mcp is not None:
        if on_mcp_disconnect := config.code.on_mcp_disconnect:
            try:
                await on_mcp_disconnect(payload.name, old_mcp.client)
            except Exception:
                logger.debug(
                    "Error in on_mcp_disconnect callback for %s",
                    payload.name,
                    exc_info=True,
                )
        try:
            await old_mcp.close()
        except Exception:
            logger.debug(
                "Error closing old MCP session %s", payload.name, exc_info=True
            )

    tool_list = await mcp_client_session.list_tools()

    # `type` (named servers) vs `clientType` (user-provided) — IMcp in
    # libs/react-client/src/types/mcp.ts declares both as optional, not
    # nullable, so the field that doesn't apply is omitted rather than sent
    # as null.
    mcp_payload: Dict[str, object] = {
        "name": mcp_connection.name,
        "tools": [{"name": t.name} for t in tool_list.tools],
        "isUserProvided": is_user_provided,
        # Only echo url/headers back for user-provided servers — the client
        # already sent those. For named servers they come from the
        # developer's config (may contain secrets) and must not leak.
        "url": getattr(mcp_connection, "url", None) if is_user_provided else None,
        "headers": getattr(mcp_connection, "headers", None)
        if is_user_provided
        else None,
    }
    if is_user_provided:
        mcp_payload["clientType"] = mcp_connection.clientType
    else:
        mcp_payload["type"] = mcp_connection.clientType

    return JSONResponse(
        content={
            "success": True,
            "mcp": mcp_payload,
        }
    )


@router.delete("/mcp")
async def disconnect_mcp(
    payload: DisconnectMCPRequest,
    current_user: UserParam,
):
    from chainlit.context import init_ws_context
    from chainlit.session import WebsocketSession

    session = WebsocketSession.get_by_id(payload.sessionId)
    context = init_ws_context(session)

    if current_user:
        if (
            not context.session.user
            or context.session.user.identifier != current_user.identifier
        ):
            raise HTTPException(
                status_code=401,
            )

    callback = config.code.on_mcp_disconnect
    if payload.name in session.mcp_sessions:
        mcp_session_obj = session.mcp_sessions.pop(payload.name)
        try:
            if callback:
                await callback(payload.name, mcp_session_obj.client)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not disconnect from the MCP: {e!s}",
            )
        finally:
            await mcp_session_obj.close()

    return JSONResponse(content={"success": True})


@router.post("/project/file")
async def upload_file(
    current_user: UserParam,
    session_id: str,
    file: UploadFile,
    ask_parent_id: Optional[str] = None,
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

    try:
        content = await file.read()

        assert file.filename, "No filename for uploaded file"
        assert file.content_type, "No content type for uploaded file"

        spec: AskFileSpec = session.files_spec.get(ask_parent_id, None)
        if not spec and ask_parent_id:
            raise HTTPException(
                status_code=404,
                detail="Parent message not found",
            )

        try:
            validate_file_upload(file, spec=spec)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        file_response = await session.persist_file(
            name=file.filename, content=content, mime=file.content_type
        )

        return JSONResponse(content=file_response)
    finally:
        await file.close()


def validate_file_upload(file: UploadFile, spec: Optional[AskFileSpec] = None):
    """Validate the file upload as configured in config.features.spontaneous_file_upload or by AskFileSpec
    for a specific message.

    Args:
        file (UploadFile): The file to validate.
        spec (AskFileSpec): The file spec to validate against if any.
    Raises:
        ValueError: If the file is not allowed.
    """
    if not spec and config.features.spontaneous_file_upload is None:
        """Default for a missing config is to allow the fileupload without any restrictions"""
        return

    if not spec and not config.features.spontaneous_file_upload.enabled:
        raise ValueError("File upload is not enabled")

    validate_file_mime_type(file, spec)
    validate_file_size(file, spec)


def validate_file_mime_type(file: UploadFile, spec: Optional[AskFileSpec]):
    """Validate the file mime type as configured in config.features.spontaneous_file_upload.
    Args:
        file (UploadFile): The file to validate.
    Raises:
        ValueError: If the file type is not allowed.
    """

    if not spec and (
        config.features.spontaneous_file_upload is None
        or config.features.spontaneous_file_upload.accept is None
    ):
        "Accept is not configured, allowing all file types"
        return

    accept = config.features.spontaneous_file_upload.accept if not spec else spec.accept

    assert isinstance(accept, List) or isinstance(accept, dict), (
        "Invalid configuration for spontaneous_file_upload, accept must be a list or a dict"
    )

    if isinstance(accept, List):
        for pattern in accept:
            if fnmatch.fnmatch(str(file.content_type), pattern):
                return
    elif isinstance(accept, dict):
        for pattern, extensions in accept.items():
            if fnmatch.fnmatch(str(file.content_type), pattern):
                if len(extensions) == 0:
                    return
                for extension in extensions:
                    if file.filename is not None and file.filename.lower().endswith(
                        extension.lower()
                    ):
                        return
    raise ValueError("File type not allowed")


def validate_file_size(file: UploadFile, spec: Optional[AskFileSpec]):
    """Validate the file size as configured in config.features.spontaneous_file_upload.
    Args:
        file (UploadFile): The file to validate.
    Raises:
        ValueError: If the file size is too large.
    """
    if not spec and (
        config.features.spontaneous_file_upload is None
        or config.features.spontaneous_file_upload.max_size_mb is None
    ):
        return

    max_size_mb = (
        config.features.spontaneous_file_upload.max_size_mb
        if not spec
        else spec.max_size_mb
    )
    if file.size is not None and file.size > max_size_mb * 1024 * 1024:
        raise ValueError("File size too large")


@router.get("/project/file/{file_id}")
async def get_file(
    file_id: str,
    session_id: str,
    current_user: UserParam,
):
    """Get a file from the session files directory."""
    from chainlit.session import WebsocketSession

    session = WebsocketSession.get_by_id(session_id) if session_id else None

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    if current_user:
        if not session.user or session.user.identifier != current_user.identifier:
            raise HTTPException(
                status_code=401,
                detail="You are not authorized to download files from this session",
            )

    if file_id in session.files:
        file = session.files[file_id]
        return FileResponse(file["path"], media_type=file["type"])
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
        logo_path = os.path.join(
            os.path.dirname(__file__),
            "frontend",
            "dist",
            f"logo_{theme_value}.svg",
        )
        logger.info("Missing custom logo. Falling back to default logo.")

    media_type, _ = mimetypes.guess_type(logo_path)

    return FileResponse(logo_path, media_type=media_type)


@router.get("/avatars/{avatar_id:str}")
async def get_avatar(avatar_id: str):
    """Get the avatar for the user based on the avatar_id."""
    if not re.match(r"^[a-zA-Z0-9_ .-]+$", avatar_id):
        raise HTTPException(status_code=400, detail="Invalid avatar_id")

    if avatar_id == "default":
        avatar_id = config.ui.name

    avatar_id = avatar_id.strip().lower().replace(" ", "_").replace(".", "_")

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


@router.get("/health")
def health_check():
    """Health check endpoint for container orchestration and monitoring."""
    return {"status": "ok"}


@router.get("/{full_path:path}")
async def serve(request: Request):
    """Serve the UI files."""
    root_path = os.getenv("CHAINLIT_PARENT_ROOT_PATH", "") + os.getenv(
        "CHAINLIT_ROOT_PATH", ""
    )
    html_template = get_html_template(root_path)
    response = HTMLResponse(content=html_template, status_code=200)

    return response


app.include_router(router)

import chainlit.socket  # noqa
