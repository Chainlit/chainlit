import os
from typing import Optional, Literal, Any, Callable, List, Dict
import tomli
from pydantic.dataclasses import dataclass
import importlib.util
import click

# Define paths and default configuration string
root = os.getcwd()
config_dir = os.path.join(root, ".chainlit")
config_file = os.path.join(config_dir, "config.toml")

default_config_str = """[project]
# Name of the app and chatbot.
name = "Chatbot"

# If true (default), the app will be available to anonymous users (once deployed).
# If false, users will need to authenticate and be part of the project to use the app.
public = true

# The project ID (found on https://cloud.chainlit.io).
# If provided, all the message data will be stored in the cloud.
# The project ID is required when public is set to false.
#id = ""

# List of environment variables to be provided by each user to use the app.
user_env = []

[env]
# Environment variables to be loaded.
#OPENAI_API_KEY = "..."
"""

# Set environment and server URL
chainlit_env = os.environ.get("CHAINLIT_ENV") or "development"
if chainlit_env == "development":
    # chainlit_server = "http://localhost:3000"
    chainlit_server = "https://cloud.chainlit.io"
else:
    chainlit_server = "https://cloud.chainlit.io"

@dataclass
class ChainlitConfig:
    root: str
    chainlit_env: Literal['development', 'production']
    chainlit_server: str
    chatbot_name: str
    public: bool
    user_env: List[str]
    lc_cache_path: str
    local_db_path: str
    project_id: Optional[str] = None
    on_stop: Optional[Callable[[Dict[str, str]], Any]] = None
    on_chat_start: Optional[Callable[[Dict[str, str]], Any]] = None
    on_message: Optional[Callable[[str, Dict[str, str]], Any]] = None
    lc_postprocess: Optional[Callable[[Any, Dict[str, str]], Any]] = None
    lc_factory: Optional[Callable[[Dict[str, str]], Any]] = None
    module_name: Optional[str] = None
    module: Any = None

def init_config(log=False):
    """Initialize the configuration file if it doesn't exist."""
    if not os.path.exists(config_file):
        os.makedirs(config_dir, exist_ok=True)
        with open(config_file, 'w') as f:
            f.write(default_config_str)
            print("Created default config file at", config_file)
    elif log:
        print("Config file already exists at", config_file)

def load_module(target: str):
    """Load the specified module."""
    if not os.path.exists(target):
        raise click.BadParameter(f"File does not exist: {target}")

    spec = importlib.util.spec_from_file_location(target, target)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    config.module = module

def load_config():
    """Load the configuration from the config file."""
    init_config()
    with open(config_file, "rb") as f:
        toml_dict = tomli.load(f)

        # Load environment variables
        env = toml_dict.get("env", {})
        if env:
            os.environ.update(env)

        # Load project settings
        project_settings = toml_dict.get("project", {})
        chatbot_name = project_settings.get("name")
        project_id = project_settings.get("id")
        public = project_settings.get("public")
        user_env = project_settings.get("user_env")

        if not public and not project_id:
            raise ValueError("Project ID is required when public is set to false.")

        # Set cache and database paths
        lc_cache_path = os.path.join(config_dir, ".langchain.db")
        local_db_path = os.path.join(config_dir, ".local.db")

        config = ChainlitConfig(
            root=root,
            chainlit_env=chainlit_env,
            chainlit_server=chainlit_server,
            chatbot_name=chatbot_name,
            public=public,
            user_env=user_env,
            lc_cache_path=lc_cache_path,
            local_db_path=local_db_path,
            project_id=project_id,
        )

    return config

config = load_config()
