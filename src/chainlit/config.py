from dataclasses import dataclass
from typing import Optional
from chainlit.db import Project

@dataclass
class Config:
    bot_name: str = "Chatbot"
    headless: bool = False,
    module: Optional[str] = None
    project: Project = None


config = Config()