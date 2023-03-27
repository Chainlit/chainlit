from typing import Dict, TypedDict, Optional, Callable, Any
from chainlit.client import GqlClient


class Session(TypedDict):
    emit: Callable[[str, Any], None]
    agent: Any
    predict: Optional[Callable[[str], str]]
    process_response: Optional[Callable[[Any], str]]
    client: Optional[GqlClient]


sessions: Dict[str, Session] = {}
