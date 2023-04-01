from dataclasses import dataclass
import os
from typing import Optional, Dict, Literal, Any, Callable
import json
import jsonschema

config_schema = {
    "type": "object",
    "properties": {
        "chatbot_name": {"type": "string"},
        "project_id": {"type": "string"},
        "env": {
            "type": "object"
        },
        "user_env": {
            "type": "object"
        },
        "auth": {"type": "boolean"},
        "lc_cache_path": {"type": "string"},
    },
    "required": ["project_id", "chatbot_name", "env", "auth"]
}

chainlit_env = os.environ.get("CHAINLIT_ENV") or "development"
if chainlit_env == "development":
    chainlit_server = "http://localhost:3000"
else:
    chainlit_server = "https://cloud.chainlit.com"


@dataclass
class Config:
    chainlit_env: Literal['development', 'production']
    root: str
    chainlit_server: str
    chatbot_name: str = "Chatbot"
    project_id: Optional[str] = None
    auth: bool = True
    env: Optional[Dict[str, str]] = None
    on_message: Optional[Callable[[str], Any]] = None
    lc_postprocess: Optional[Callable] = None
    lc_factory: Optional[Callable] = None
    user_env: Optional[Dict[str, str]] = None
    lc_cache_path: str = None
    local_db_path: str = None
    headless: bool = False,
    module_name: Optional[str] = None
    module: Any = None


def load_config(root: str):
    global config

    try:
        with open(f'{root}/chainlit.json', "r") as f:
            _config = json.load(f)
            jsonschema.validate(config, config_schema)
            config = Config(chainlit_env=chainlit_env, root=root,
                            chainlit_server=chainlit_server, **_config)
    except FileNotFoundError:
        config = Config(chainlit_env=chainlit_env,
                        chainlit_server=chainlit_server, root=root)

    if not config.lc_cache_path:
        config.lc_cache_path = os.path.join(root, ".langchain.db")
        config.local_db_path = os.path.join(root, ".local.db")

    return config


config = None  # type: Config
