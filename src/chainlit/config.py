from dataclasses import dataclass
from typing import Optional

@dataclass
class Config:
    bot_name: str = "Chatbot"
    headless: bool = False,
    module: Optional[str] = None


config = Config()