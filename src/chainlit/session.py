from typing import Dict, TypedDict, Optional, Callable, Any
from chainlit.client import BaseClient


class Session(TypedDict):
    emit: Callable[[str, Any], None]
    conversation_id: Optional[str]
    agent: Any
    predict: Optional[Callable[[str], str]]
    process_response: Optional[Callable[[Any], str]]
    client: Optional[BaseClient]


sessions: Dict[str, Session] = {}
