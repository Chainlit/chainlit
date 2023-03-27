from dataclasses import dataclass
from typing import Optional, TYPE_CHECKING
if TYPE_CHECKING:
    from chainlit.db import Project

@dataclass
class Config:
    project_id: str = None
    bot_name: str = "Chatbot"
    headless: bool = False,
    module: Optional[str] = None
    project: 'Project' = None
    cache_path: str = None
    db_path: str = None


config = Config()