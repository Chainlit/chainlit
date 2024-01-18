import json
import os
import sys
from importlib import util
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Dict, List, Optional

import tomli
from chainlit.logger import logger
from chainlit.version import __version__
from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import Field, dataclass
from starlette.datastructures import Headers

if TYPE_CHECKING:
    from chainlit.action import Action
    from chainlit.types import ChatProfile, ThreadDict
    from chainlit.user import User
    from fastapi import Request, Response


BACKEND_ROOT = os.path.dirname(__file__)
PACKAGE_ROOT = os.path.dirname(os.path.dirname(BACKEND_ROOT))
TRANSLATIONS_DIR = os.path.join(BACKEND_ROOT, "translations")


# Get the directory the script is running from
APP_ROOT = os.getcwd()

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
# Show the prompt playground
prompt_playground = true

# Process and display HTML in messages. This can be a security risk (see https://stackoverflow.com/questions/19603097/why-is-it-dangerous-to-render-user-generated-html-or-javascript)
unsafe_allow_html = false

# Process and display mathematical expressions. This can clash with "$" characters in messages.
latex = false

# Authorize users to upload files with messages
multi_modal = true

# Allows user to use speech to text
[features.speech_to_text]
    enabled = false
    # See all languages here https://github.com/JamesBrill/react-speech-recognition/blob/HEAD/docs/API.md#language-string
    # language = "en-US"

[UI]
# Name of the app and chatbot.
name = "Chatbot"

# Show the readme while the thread is empty.
show_readme_as_default = true

# Description of the app and chatbot. This is used for HTML tags.
# description = ""

# Large size content are by default collapsed for a cleaner ui
default_collapse_content = true

# The default value for the expand messages settings.
default_expand_messages = false

# Hide the chain of thought details from the user in the UI.
hide_cot = false

# Link to your github repo. This will add a github button in the UI's header.
# github = ""

# Specify a CSS file that can be used to customize the user interface.
# The CSS file can be served from the public directory or via an external link.
# custom_css = "/public/test.css"

# Specify a custom font url.
# custom_font = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"

# Override default MUI light theme. (Check theme.ts)
[UI.theme]
    #font_family = "Inter, sans-serif"
[UI.theme.light]
    #background = "#FAFAFA"
    #paper = "#FFFFFF"

    [UI.theme.light.primary]
        #main = "#F80061"
        #dark = "#980039"
        #light = "#FFE7EB"

# Override default MUI dark theme. (Check theme.ts)
[UI.theme.dark]
    #background = "#FAFAFA"
    #paper = "#FFFFFF"

    [UI.theme.dark.primary]
        #main = "#F80061"
        #dark = "#980039"
        #light = "#FFE7EB"


[meta]
generated_by = "{__version__}"
"""


DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000


@dataclass()
class RunSettings:
    # Name of the module (python file) used in the run command
    module_name: Optional[str] = None
    host: str = DEFAULT_HOST
    port: int = DEFAULT_PORT
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
class Palette(DataClassJsonMixin):
    primary: Optional[PaletteOptions] = None
    background: Optional[str] = ""
    paper: Optional[str] = ""


@dataclass()
class Theme(DataClassJsonMixin):
    font_family: Optional[str] = None
    light: Optional[Palette] = None
    dark: Optional[Palette] = None


@dataclass
class SpeechToTextFeature:
    enabled: Optional[bool] = None
    language: Optional[str] = None


@dataclass()
class FeaturesSettings(DataClassJsonMixin):
    prompt_playground: bool = True
    multi_modal: bool = True
    latex: bool = False
    unsafe_allow_html: bool = False
    speech_to_text: Optional[SpeechToTextFeature] = None


@dataclass()
class UISettings(DataClassJsonMixin):
    name: str
    show_readme_as_default: bool = True
    description: str = ""
    hide_cot: bool = False
    # Large size content are by default collapsed for a cleaner ui
    default_collapse_content: bool = True
    default_expand_messages: bool = False
    github: Optional[str] = None
    theme: Optional[Theme] = None
    # Optional custom CSS file that allows you to customize the UI
    custom_css: Optional[str] = None
    custom_font: Optional[str] = None


@dataclass()
class CodeSettings:
    # Developer defined callbacks for each action. Key is the action name, value is the callback function.
    action_callbacks: Dict[str, Callable[["Action"], Any]]
    # Module object loaded from the module_name
    module: Any = None
    # Bunch of callbacks defined by the developer
    password_auth_callback: Optional[Callable[[str, str], Optional["User"]]] = None
    header_auth_callback: Optional[Callable[[Headers], Optional["User"]]] = None
    oauth_callback: Optional[
        Callable[[str, str, Dict[str, str], "User"], Optional["User"]]
    ] = None
    on_logout: Optional[Callable[["Request", "Response"], Any]] = None
    on_stop: Optional[Callable[[], Any]] = None
    on_chat_start: Optional[Callable[[], Any]] = None
    on_chat_end: Optional[Callable[[], Any]] = None
    on_chat_resume: Optional[Callable[["ThreadDict"], Any]] = None
    on_message: Optional[Callable[[str], Any]] = None
    author_rename: Optional[Callable[[str], str]] = None
    on_settings_update: Optional[Callable[[Dict[str, Any]], Any]] = None
    set_chat_profiles: Optional[
        Callable[[Optional["User"]], List["ChatProfile"]]
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

        translation_lib_file_path = os.path.join(
            config_translation_dir, f"{language}.json"
        )
        default_translation_lib_file_path = os.path.join(
            config_translation_dir, f"{default_language}.json"
        )

        if os.path.exists(translation_lib_file_path):
            with open(translation_lib_file_path, "r", encoding="utf-8") as f:
                translation = json.load(f)
        elif os.path.exists(default_translation_lib_file_path):
            logger.warning(
                f"Translation file for {language} not found. Using default translation {default_language}."
            )
            with open(default_translation_lib_file_path, "r", encoding="utf-8") as f:
                translation = json.load(f)

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
        # Clear the modules related to the app from sys.modules
        for module_name, module in list(sys.modules.items()):
            if (
                hasattr(module, "__file__")
                and module.__file__
                and module.__file__.startswith(target_dir)
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

        return {
            "features": features_settings,
            "ui": ui_settings,
            "project": project_settings,
            "code": CodeSettings(action_callbacks={}),
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


config = load_config()
