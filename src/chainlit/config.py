from dataclasses import dataclass
from typing import Optional
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from chainlit.db import Project

@dataclass
class Config:
    bot_name: str = "Chatbot"
    headless: bool = False,
    module: Optional[str] = None
    project: 'Project' = None
    cache_path: str = None
    db_path: str = None


config = Config()