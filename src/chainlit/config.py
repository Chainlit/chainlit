import os
from typing import Optional, Literal, Any, Callable, List
import tomli
from pydantic.dataclasses import dataclass

root = os.getcwd()
chainlit_config_dir = os.path.join(root, ".chainlit")
chainlit_config_file = os.path.join(chainlit_config_dir, "config.toml")

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
    on_message: Optional[Callable[[str], Any]] = None
    lc_postprocess: Optional[Callable] = None
    lc_factory: Optional[Callable] = None
    module_name: Optional[str] = None
    module: Any = None

def init_config(log=False):
    if not os.path.exists(chainlit_config_file):
        os.makedirs(chainlit_config_dir, exist_ok=True)
        with open(chainlit_config_file, 'w') as f:
            f.write(default_config_str)
            print("Created default config file at", chainlit_config_file)
    elif log:
        print("Config file already exists at", chainlit_config_file)

def load_config():
    init_config()
    with open(chainlit_config_file, "rb") as f:
        toml_dict = tomli.load(f)

        env = toml_dict.get("env", {})
        if env:
            os.environ.update(env)

        chatbot_name = toml_dict.get("project", {}).get("name")
        project_id = toml_dict.get("project", {}).get("id")
        public = toml_dict.get("project", {}).get("public")

        if not public and not project_id:
            raise ValueError("Project ID is required when public is set to false.")

        user_env = toml_dict.get("project", {}).get("user_env")

        lc_cache_path = os.path.join(chainlit_config_dir, ".langchain.db")
        local_db_path = os.path.join(chainlit_config_dir, ".local.db")

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
