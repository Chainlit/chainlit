from typing import Dict, TypedDict, Optional, Callable, Any
from chainlit.client import BaseClient

class PromptResponse(TypedDict):
    content: str
    author: str

class Session(TypedDict):
    id: str
    prompt: Callable[[Any, Optional[int]], PromptResponse]
    emit: Callable[[str, Any], None]
    conversation_id: Optional[str]
    agent: Any
    task: Optional[Any]
    user_env: Optional[Dict[str, str]]
    predict: Optional[Callable[[str], str]]
    process_response: Optional[Callable[[Any], str]]
    client: Optional[BaseClient]


sessions: Dict[str, Session] = {}
