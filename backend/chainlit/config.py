import json
import os
import site
import sys
from importlib import util
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Any,
    Awaitable,
    Callable,
    Dict,
    List,
    Literal,
    Optional,
    Union,
)

import tomli
from chainlit.logger import logger
from chainlit.translations import lint_translation_json
from chainlit.version import __version__
from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import Field, dataclass
from starlette.datastructures import Headers

from ._utils import is_path_inside

if TYPE_CHECKING:
    from chainlit.action import Action
    from chainlit.element import ElementBased
    from chainlit.message import Message
    from chainlit.types import AudioChunk, ChatProfile, Starter, ThreadDict
    from chainlit.user import User
    from fastapi import Request, Response


BACKEND_ROOT = os.path.dirname(__file__)
PACKAGE_ROOT = os.path.dirname(os.path.dirname(BACKEND_ROOT))
TRANSLATIONS_DIR = os.path.join(BACKEND_ROOT, "translations")


# Get the directory the script is running from
APP_ROOT = os.getenv("CHAINLIT_APP_ROOT", os.getcwd())

# Create the directory to store the uploaded files
FILES_DIRECTORY = Path(APP_ROOT) / ".files"
FILES_DIRECTORY.mkdir(exist_ok=True)

config_dir = os.path.join(APP_ROOT, ".chainlit")
config_file = os.path.join(config_dir, "config.toml")
config_translation_dir = os.path.join(config_dir, "translations")

# Default config file created if none exists
DEFAULT_CONFIG_STR = f"""[project]
# Whether to enable telemetry (default: true). No personal data is collected.
enable_telemetry = true


# List of environment variables to be provided by each user to use the app.
user_env = []

# Duration (in seconds) during which the session is saved when the connection is lost
session_timeout = 3600

# Enable third parties caching (e.g LangChain cache)
cache = false

# Authorized origins
allow_origins = ["*"]

# Follow symlink for asset mount (see https://github.com/Chainlit/chainlit/issues/317)
# follow_symlink = false

[features]
# Process and display HTML in messages. This can be a security risk (see https://stackoverflow.com/questions/19603097/why-is-it-dangerous-to-render-user-generated-html-or-javascript)
unsafe_allow_html = false

# Process and display mathematical expressions. This can clash with "$" characters in messages.
latex = false

# Automatically tag threads with the current chat profile (if a chat profile is used)
auto_tag_thread = true

# Allow users to edit their own messages
edit_message = true

# Authorize users to spontaneously upload files with messages
[features.spontaneous_file_upload]
    enabled = true
    accept = ["*/*"]
    max_files = 20
    max_size_mb = 500

[features.audio]
    # Threshold for audio recording
    min_decibels = -45
    # Delay for the user to start speaking in MS
    initial_silence_timeout = 3000
    # Delay for the user to continue speaking in MS. If the user stops speaking for this duration, the recording will stop.
    silence_timeout = 1500
    # Above this duration (MS), the recording will forcefully stop.
    max_duration = 15000
    # Duration of the audio chunks in MS
    chunk_duration = 1000
    # Sample rate of the audio
    sample_rate = 44100

[UI]
# Name of the assistant.
name = "Assistant"

# Description of the assistant. This is used for HTML tags.
# description = ""

# Large size content are by default collapsed for a cleaner ui
default_collapse_content = true

# Chain of Thought (CoT) display mode. Can be "hidden", "tool_call" or "full".
cot = "full"

# Link to your github repo. This will add a github button in the UI's header.
# github = ""

# Specify a CSS file that can be used to customize the user interface.
# The CSS file can be served from the public directory or via an external link.
# custom_css = "/public/test.css"

# Specify a Javascript file that can be used to customize the user interface.
# The Javascript file can be served from the public directory.
# custom_js = "/public/test.js"

# Specify a custom font url.
# custom_font = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"

# Specify a custom meta image url.
# custom_meta_image_url = "https://chainlit-cloud.s3.eu-west-3.amazonaws.com/logo/chainlit_banner.png"

# Specify a custom build directory for the frontend.
# This can be used to customize the frontend code.
# Be careful: If this is a relative path, it should not start with a slash.
# custom_build = "./public/build"

[UI.theme]
    default = "dark"
    #layout = "wide"
    #font_family = "Inter, sans-serif"
# Override default MUI light theme. (Check theme.ts)
[UI.theme.light]
    #background = "#FAFAFA"
    #paper = "#FFFFFF"

    [UI.theme.light.primary]
        #main = "#F80061"
        #dark = "#980039"
        #light = "#FFE7EB"
    [UI.theme.light.text]
        #primary = "#212121"
        #secondary = "#616161"

# Override default MUI dark theme. (Check theme.ts)
[UI.theme.dark]
    #background = "#FAFAFA"
    #paper = "#FFFFFF"

    [UI.theme.dark.primary]
        #main = "#F80061"
        #dark = "#980039"
        #light = "#FFE7EB"
    [UI.theme.dark.text]
        #primary = "#EEEEEE"
        #secondary = "#BDBDBD"

[meta]
generated_by = "{__version__}"
"""


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000
DEFAULT_ROOT_PATH = ""


@dataclass()
class RunSettings:
    # Name of the module (python file) used in the run command
    module_name: Optional[str] = None
    host: str = DEFAULT_HOST
    port: int = DEFAULT_PORT
    ssl_cert: Optional[str] = None
    ssl_key: Optional[str] = None
    root_path: str = DEFAULT_ROOT_PATH
    headless: bool = False
    watch: bool = False
    no_cache: bool = False
    debug: bool = False
    ci: bool = False


@dataclass()
class PaletteOptions(DataClassJsonMixin):
    main: Optional[str] = ""
    light: Optional[str] = ""
    dark: Optional[str] = ""


@dataclass()
class TextOptions(DataClassJsonMixin):
    primary: Optional[str] = ""
    secondary: Optional[str] = ""


@dataclass()
class Palette(DataClassJsonMixin):
    primary: Optional[PaletteOptions] = None
    background: Optional[str] = ""
    paper: Optional[str] = ""
    text: Optional[TextOptions] = None


@dataclass()
class Theme(DataClassJsonMixin):
    font_family: Optional[str] = None
    default: Optional[Literal["light", "dark"]] = "dark"
    layout: Optional[Literal["default", "wide"]] = "default"
    light: Optional[Palette] = None
    dark: Optional[Palette] = None


@dataclass
class SpontaneousFileUploadFeature(DataClassJsonMixin):
    enabled: Optional[bool] = None
    accept: Optional[Union[List[str], Dict[str, List[str]]]] = None
    max_files: Optional[int] = None
    max_size_mb: Optional[int] = None


@dataclass
class AudioFeature(DataClassJsonMixin):
    min_decibels: int = -45
    initial_silence_timeout: int = 2000
    silence_timeout: int = 1500
    chunk_duration: int = 1000
    max_duration: int = 15000
    sample_rate: int = 44100
    enabled: bool = False


@dataclass()
class FeaturesSettings(DataClassJsonMixin):
    spontaneous_file_upload: Optional[SpontaneousFileUploadFeature] = None
    audio: Optional[AudioFeature] = Field(default_factory=AudioFeature)
    latex: bool = False
    unsafe_allow_html: bool = False
    auto_tag_thread: bool = True
    edit_message: bool = True


@dataclass()
class UISettings(DataClassJsonMixin):
    name: str
    description: str = ""
    cot: Literal["hidden", "tool_call", "full"] = "full"
    # Large size content are by default collapsed for a cleaner ui
    default_collapse_content: bool = True
    github: Optional[str] = None
    theme: Optional[Theme] = None
    # Optional custom CSS file that allows you to customize the UI
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    custom_font: Optional[str] = None
    # Optional custom meta tag for image preview
    custom_meta_image_url: Optional[str] = None
    # Optional custom build directory for the frontend
    custom_build: Optional[str] = None


@dataclass()
class CodeSettings:
    # Developer defined callbacks for each action. Key is the action name, value is the callback function.
    action_callbacks: Dict[str, Callable[["Action"], Any]]
    # Module object loaded from the module_name
    module: Any = None
    # Bunch of callbacks defined by the developer
    password_auth_callback: Optional[
        Callable[[str, str], Awaitable[Optional["User"]]]
    ] = None
    header_auth_callback: Optional[
        Callable[[Headers], Awaitable[Optional["User"]]]
    ] = None
    oauth_callback: Optional[
        Callable[[str, str, Dict[str, str], "User"], Awaitable[Optional["User"]]]
    ] = None
    on_logout: Optional[Callable[["Request", "Response"], Any]] = None
    on_stop: Optional[Callable[[], Any]] = None
    on_chat_start: Optional[Callable[[], Any]] = None
    on_chat_end: Optional[Callable[[], Any]] = None
    on_chat_resume: Optional[Callable[["ThreadDict"], Any]] = None
    on_message: Optional[Callable[["Message"], Any]] = None
    on_audio_chunk: Optional[Callable[["AudioChunk"], Any]] = None
    on_audio_end: Optional[Callable[[List["ElementBased"]], Any]] = None

    author_rename: Optional[Callable[[str], Awaitable[str]]] = None
    on_settings_update: Optional[Callable[[Dict[str, Any]], Any]] = None
    set_chat_profiles: Optional[
        Callable[[Optional["User"]], Awaitable[List["ChatProfile"]]]
    ] = None
    set_starters: Optional[
        Callable[[Optional["User"]], Awaitable[List["Starter"]]]
    ] = None


@dataclass()
class ProjectSettings(DataClassJsonMixin):
    allow_origins: List[str] = Field(default_factory=lambda: ["*"])
    enable_telemetry: bool = True
    # List of environment variables to be provided by each user to use the app. If empty, no environment variables will be asked to the user.
    user_env: Optional[List[str]] = None
    # Path to the local langchain cache database
    lc_cache_path: Optional[str] = None
    # Path to the local chat db
    # Duration (in seconds) during which the session is saved when the connection is lost
    session_timeout: int = 3600
    # Enable third parties caching (e.g LangChain cache)
    cache: bool = False
    # Follow symlink for asset mount (see https://github.com/Chainlit/chainlit/issues/317)
    follow_symlink: bool = False


@dataclass()
class ChainlitConfig:
    # Directory where the Chainlit project is located
    root = APP_ROOT
    # Chainlit server URL. Used only for cloud features
    chainlit_server: str
    run: RunSettings
    features: FeaturesSettings
    ui: UISettings
    project: ProjectSettings
    code: CodeSettings

    def load_translation(self, language: str):
        translation = {}
        default_language = "en-US"
        # fallback to root language (ex: `de` when `de-DE` is not found)
        parent_language = language.split("-")[0]

        translation_dir = Path(config_translation_dir)

        translation_lib_file_path = translation_dir / f"{language}.json"
        translation_lib_parent_language_file_path = (
            translation_dir / f"{parent_language}.json"
        )
        default_translation_lib_file_path = translation_dir / f"{default_language}.json"

        if (
            is_path_inside(translation_lib_file_path, translation_dir)
            and translation_lib_file_path.is_file()
        ):
            translation = json.loads(
                translation_lib_file_path.read_text(encoding="utf-8")
            )
        elif (
            is_path_inside(translation_lib_parent_language_file_path, translation_dir)
            and translation_lib_parent_language_file_path.is_file()
        ):
            logger.warning(
                f"Translation file for {language} not found. Using parent translation {parent_language}."
            )
            translation = json.loads(
                translation_lib_parent_language_file_path.read_text(encoding="utf-8")
            )
        elif (
            is_path_inside(default_translation_lib_file_path, translation_dir)
            and default_translation_lib_file_path.is_file()
        ):
            logger.warning(
                f"Translation file for {language} not found. Using default translation {default_language}."
            )
            translation = json.loads(
                default_translation_lib_file_path.read_text(encoding="utf-8")
            )

        return translation


def init_config(log=False):
    """Initialize the configuration file if it doesn't exist."""
    if not os.path.exists(config_file):
        os.makedirs(config_dir, exist_ok=True)
        with open(config_file, "w", encoding="utf-8") as f:
            f.write(DEFAULT_CONFIG_STR)
            logger.info(f"Created default config file at {config_file}")
    elif log:
        logger.info(f"Config file already exists at {config_file}")

    if not os.path.exists(config_translation_dir):
        os.makedirs(config_translation_dir, exist_ok=True)
        logger.info(
            f"Created default translation directory at {config_translation_dir}"
        )

    for file in os.listdir(TRANSLATIONS_DIR):
        if file.endswith(".json"):
            dst = os.path.join(config_translation_dir, file)
            if not os.path.exists(dst):
                src = os.path.join(TRANSLATIONS_DIR, file)
                with open(src, "r", encoding="utf-8") as f:
                    translation = json.load(f)
                    with open(dst, "w", encoding="utf-8") as f:
                        json.dump(translation, f, indent=4)
                        logger.info(f"Created default translation file at {dst}")


def load_module(target: str, force_refresh: bool = False):
    """Load the specified module."""

    # Get the target's directory
    target_dir = os.path.dirname(os.path.abspath(target))

    # Add the target's directory to the Python path
    sys.path.insert(0, target_dir)

    if force_refresh:
        # Get current site packages dirs
        site_package_dirs = site.getsitepackages()

        # Clear the modules related to the app from sys.modules
        for module_name, module in list(sys.modules.items()):
            if (
                hasattr(module, "__file__")
                and module.__file__
                and module.__file__.startswith(target_dir)
                and not any(module.__file__.startswith(p) for p in site_package_dirs)
            ):
                sys.modules.pop(module_name, None)

    spec = util.spec_from_file_location(target, target)
    if not spec or not spec.loader:
        return

    module = util.module_from_spec(spec)
    if not module:
        return

    spec.loader.exec_module(module)

    sys.modules[target] = module

    # Remove the target's directory from the Python path
    sys.path.pop(0)


def load_settings():
    with open(config_file, "rb") as f:
        toml_dict = tomli.load(f)
        # Load project settings
        project_config = toml_dict.get("project", {})
        features_settings = toml_dict.get("features", {})
        ui_settings = toml_dict.get("UI", {})
        meta = toml_dict.get("meta")

        if not meta or meta.get("generated_by") <= "0.3.0":
            raise ValueError(
                "Your config file is outdated. Please delete it and restart the app to regenerate it."
            )

        lc_cache_path = os.path.join(config_dir, ".langchain.db")

        project_settings = ProjectSettings(
            lc_cache_path=lc_cache_path,
            **project_config,
        )

        features_settings = FeaturesSettings(**features_settings)

        ui_settings = UISettings(**ui_settings)

        code_settings = CodeSettings(action_callbacks={})

        return {
            "features": features_settings,
            "ui": ui_settings,
            "project": project_settings,
            "code": code_settings,
        }


def reload_config():
    """Reload the configuration from the config file."""
    global config
    if config is None:
        return

    settings = load_settings()

    config.features = settings["features"]
    config.code = settings["code"]
    config.ui = settings["ui"]
    config.project = settings["project"]


def load_config():
    """Load the configuration from the config file."""
    init_config()

    settings = load_settings()

    chainlit_server = os.environ.get("CHAINLIT_SERVER", "https://cloud.chainlit.io")

    config = ChainlitConfig(
        chainlit_server=chainlit_server,
        run=RunSettings(),
        **settings,
    )

    return config


def lint_translations():
    # Load the ground truth (en-US.json file from chainlit source code)
    src = os.path.join(TRANSLATIONS_DIR, "en-US.json")
    with open(src, "r", encoding="utf-8") as f:
        truth = json.load(f)

        # Find the local app translations
        for file in os.listdir(config_translation_dir):
            if file.endswith(".json"):
                # Load the translation file
                to_lint = os.path.join(config_translation_dir, file)
                with open(to_lint, "r", encoding="utf-8") as f:
                    translation = json.load(f)

                    # Lint the translation file
                    lint_translation_json(file, truth, translation)


config = load_config()
