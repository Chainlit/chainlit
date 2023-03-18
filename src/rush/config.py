from dataclasses import dataclass
from typing import Optional, Any

@dataclass
class Config:
    bot_name: str = "Chatbot"
    module: Optional[str] = None


config = Config()