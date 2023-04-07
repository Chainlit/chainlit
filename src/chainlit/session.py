from typing import Dict, TypedDict, Optional, Callable, Any
from chainlit.client import BaseClient


class Session(TypedDict):
    id: str
    prompt: Callable[[str, Any], str]
    emit: Callable[[str, Any], None]
    conversation_id: Optional[str]
    agent: Any
    user_env: Optional[Dict[str, str]]
    predict: Optional[Callable[[str], str]]
    process_response: Optional[Callable[[Any], str]]
    client: Optional[BaseClient]


sessions: Dict[str, Session] = {}
