from typing import Optional, Any, Callable, Union, Literal, List, Dict, TYPE_CHECKING
import os
import sys
import tomli
from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json
from importlib import util
from chainlit.logger import logger
from chainlit.version import __version__

if TYPE_CHECKING:
    from chainlit.action import Action
    from chainlit.client.base import BaseDBClient

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
# The project ID is required when public is set to false or when using the cloud database.
#id = ""

# Uncomment if you want to persist the chats.
# local will create a database in your .chainlit directory (requires node.js installed).
# cloud will use the Chainlit cloud database.
# custom will load use your custom client.
# database = "local"

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
    llama_index_factory: Optional[Callable[[], Any]] = None
    langflow_schema: Union[Dict, str] = None
    client_factory: Optional[Callable[[str], "BaseDBClient"]] = None

    def validate(self):
        requires_one_of = [
            "lc_factory",
            "llama_index_factory",
            "on_message",
            "on_chat_start",
        ]

        mutually_exclusive = ["lc_factory", "llama_index_factory"]

        # Check if at least one of the required attributes is set
        if not any(getattr(self, attr) for attr in requires_one_of):
            raise ValueError(
                f"Module should at least expose one of {', '.join(requires_one_of)} function"
            )

        # Check if any mutually exclusive attributes are set together
        for i, attr1 in enumerate(mutually_exclusive):
            for attr2 in mutually_exclusive[i + 1 :]:
                if getattr(self, attr1) and getattr(self, attr2):
                    raise ValueError(
                        f"Module should not expose both {attr1} and {attr2} functions"
                    )

        return True


@dataclass_json
@dataclass()
class ProjectSettings:
    # Enables Cloud features if provided
    id: Optional[str] = None
    # Whether the app is available to anonymous users or only to team members.
    public: bool = True
    # Storage type
    database: Optional[Literal["local", "cloud", "custom"]] = None
    # Whether to enable telemetry. No personal data is collected.
    enable_telemetry: bool = True
    # List of environment variables to be provided by each user to use the app. If empty, no environment variables will be asked to the user.
    user_env: List[str] = None
    # Path to the local langchain cache database
    lc_cache_path: str = None
    # Path to the local chat db
    local_db_path: str = None
    # Path to the local file system
    local_fs_path: str = None


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


def load_module(target: str):
    """Load the specified module."""

    # Get the target's directory
    target_dir = os.path.dirname(os.path.abspath(target))

    # Add the target's directory to the Python path
    sys.path.insert(0, target_dir)

    spec = util.spec_from_file_location(target, target)
    module = util.module_from_spec(spec)
    spec.loader.exec_module(module)

    sys.modules[target] = module

    # Remove the target's directory from the Python path
    sys.path.pop(0)

    config.code.validate()


def load_settings():
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
        local_db_path = os.path.join(config_dir, "chat.db")
        local_fs_path = os.path.join(config_dir, "chat_files")

        os.environ[
            "LOCAL_DB_PATH"
        ] = f"file:{local_db_path}?socket_timeout=10&connection_limit=1"

        project_settings = ProjectSettings(
            lc_cache_path=lc_cache_path,
            local_db_path=local_db_path,
            local_fs_path=local_fs_path,
            **project_config,
        )

        ui_settings = UISettings(**ui_settings)

        if not project_settings.public and not project_settings.id:
            raise ValueError("Project ID is required when public is set to false.")

        return {
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

    config.code = settings["code"]
    config.ui = settings["ui"]
    config.project = settings["project"]


def load_config():
    """Load the configuration from the config file."""
    init_config()

    settings = load_settings()

    config = ChainlitConfig(
        chainlit_server=chainlit_server,
        chainlit_prod_url=chainlit_prod_url,
        run=RunSettings(),
        **settings,
    )

    return config


config = load_config()
