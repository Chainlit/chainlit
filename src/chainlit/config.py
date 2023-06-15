from typing import Optional, Any, Callable, List, Dict, TYPE_CHECKING
import os
import sys
import tomli
from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json
from importlib import machinery
from chainlit.logger import logger
from chainlit.version import __version__

if TYPE_CHECKING:
    from chainlit.action import Action

PACKAGE_ROOT = os.path.dirname(__file__)

# Get the directory the script is running from
APP_ROOT = os.getcwd()

config_dir = os.path.join(APP_ROOT, ".chainlit")
config_file = os.path.join(config_dir, "config.toml")

# Default config file created if none exists
DEFAULT_CONFIG_STR = f"""[project]
# If true (default), the app will be available to anonymous users.
# If false, users will need to authenticate and be part of the project to use the app.
public = true

# The project ID (found on https://cloud.chainlit.io).
# If provided, all the message data will be stored in the cloud.
# The project ID is required when public is set to false.
#id = ""

# Whether to enable telemetry (default: true). No personal data is collected.
enable_telemetry = true

# List of environment variables to be provided by each user to use the app.
user_env = []

[UI]
# Name of the app and chatbot.
name = "Chatbot"

# Description of the app and chatbot. This is used for HTML tags.
# description = ""

# The default value for the expand messages settings.
default_expand_messages = false

# Hide the chain of thought details from the user in the UI.
hide_cot = false

# Link to your github repo. This will add a github button in the UI's header.
# github = ""

[meta]
generated_by = "{__version__}"
"""

chainlit_prod_url = os.environ.get("CHAINLIT_PROD_URL")
chainlit_server = "https://cloud.chainlit.io"


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


@dataclass_json
@dataclass()
class UISettings:
    name: str
    description: str = ""
    hide_cot: bool = False
    default_expand_messages: bool = False
    github: str = None


@dataclass()
class CodeSettings:
    # Developer defined callbacks for each action. Key is the action name, value is the callback function.
    action_callbacks: Dict[str, Callable[["Action"], Any]]
    # Module object loaded from the module_name
    module: Any = None
    # Bunch of callbacks defined by the developer
    on_stop: Optional[Callable[[], Any]] = None
    on_chat_start: Optional[Callable[[], Any]] = None
    on_message: Optional[Callable[[str], Any]] = None
    lc_agent_is_async: Optional[bool] = None
    lc_run: Optional[Callable[[Any, str], str]] = None
    lc_postprocess: Optional[Callable[[Any], str]] = None
    lc_factory: Optional[Callable[[], Any]] = None
    lc_rename: Optional[Callable[[str], str]] = None


@dataclass_json
@dataclass()
class ProjectSettings:
    # Enables Cloud features if provided
    id: Optional[str] = None
    # Whether the app is available to anonymous users or only to team members.
    public: bool = True
    # Whether to enable telemetry. No personal data is collected.
    enable_telemetry: bool = True
    # List of environment variables to be provided by each user to use the app. If empty, no environment variables will be asked to the user.
    user_env: List[str] = None
    # Path to the local langchain cache database
    lc_cache_path: str = None


@dataclass()
class ChainlitConfig:
    # Directory where the Chainlit project is located
    root = APP_ROOT
    # Chainlit server URL. Used only for cloud features
    chainlit_server: str
    # The url of the deployed app. Only set if the app is deployed.
    chainlit_prod_url = chainlit_prod_url

    run: RunSettings
    ui: UISettings
    project: ProjectSettings
    code: CodeSettings


def init_config(log=False):
    """Initialize the configuration file if it doesn't exist."""
    if not os.path.exists(config_file):
        os.makedirs(config_dir, exist_ok=True)
        with open(config_file, "w", encoding="utf-8") as f:
            f.write(DEFAULT_CONFIG_STR)
            logger.info(f"Created default config file at {config_file}")
    elif log:
        logger.info(f"Config file already exists at {config_file}")


def reset_module_config():
    if not config:
        return

    config.code = CodeSettings(action_callbacks={})


def load_module(target: str):
    """Load the specified module."""

    # Reset the config fields that belonged to the previous module
    reset_module_config()

    # Get the target's directory
    target_dir = os.path.dirname(os.path.abspath(target))

    # Add the target's directory to the Python path
    sys.path.insert(0, target_dir)

    loader = machinery.SourceFileLoader(target, target)
    config.code.module = loader.load_module()

    # Remove the target's directory from the Python path
    sys.path.pop(0)


def load_config():
    """Load the configuration from the config file."""
    init_config()
    with open(config_file, "rb") as f:
        toml_dict = tomli.load(f)
        # Load project settings
        project_config = toml_dict.get("project", {})
        ui_settings = toml_dict.get("UI", {})
        meta = toml_dict.get("meta")

        if not meta or meta.get("generated_by") <= "0.3.0":
            raise ValueError(
                "Your config file is outdated. Please delete it and restart the app to regenerate it."
            )

        lc_cache_path = os.path.join(config_dir, ".langchain.db")

        project_settings = ProjectSettings(
            lc_cache_path=lc_cache_path, **project_config
        )
        ui_settings = UISettings(**ui_settings)

        if not project_settings.public and not project_settings.project_id:
            raise ValueError("Project ID is required when public is set to false.")

        config = ChainlitConfig(
            chainlit_server=chainlit_server,
            chainlit_prod_url=chainlit_prod_url,
            ui=ui_settings,
            run=RunSettings(),
            project=project_settings,
            code=CodeSettings(action_callbacks={}),
        )

    return config


config = load_config()
