from dataclasses import dataclass
from typing import Optional
from rush.inject import RushInject

@dataclass
class Config:
    bot_name: str = "Chatbot"
    module: Optional[str] = None
    inject: Optional[RushInject] = None


config = Config()