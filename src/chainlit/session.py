from typing import Dict, TypedDict, Optional, Callable, Any, Union
from chainlit.client import BaseClient
from chainlit.types import AskResponse, AskFileSpec


class Session(TypedDict):
    """Internal session object."""

    # The ID of the session
    id: str
    # Function to ask the user a question
    ask_user: Callable[[Any, Optional[int]], Union[AskResponse, None]]
    # Function to emit a message to the user
    emit: Callable[[str, Any], None]
    # User specific environment variables. Empty if no user environment variables are required.
    user_env: Dict[str, str]
    # Optional langchain agent
    agent: Any
    # Potential background task running
    task: Optional[Any]
    # Optional client to persist messages and files
    client: Optional[BaseClient]


sessions: Dict[str, Session] = {}
