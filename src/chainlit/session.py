from typing import Dict, TypedDict, Optional, Callable, Any


class Session(TypedDict):
    emit: Callable[[str, Any], None]
    agent: Any
    predict: Optional[Callable[[str], str]]
    process_response: Optional[Callable[[Any], str]]


sessions: Dict[str, Session] = {}
