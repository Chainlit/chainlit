import os
from typing import Any, Dict, List

from chainlit import input_widget
from chainlit.config import config
from chainlit.telemetry import trace_event
from chainlit.types import CompletionRequest


class BaseProvider:
    id: str
    name: str
    env_var: List[str]
    inputs: List[input_widget.InputWidget]
    is_chat: bool

    def __init__(
        self,
        id: str,
        name: str,
        inputs: List[input_widget.InputWidget],
        env_var: List[str] = [],
        is_chat=False,
    ) -> None:
        self.id = id
        self.name = name
        self.env_var = env_var
        self.inputs = inputs
        self.is_chat = is_chat

    async def create_completion(self, request: CompletionRequest):
        trace_event("completion")

    def _is_env_var_available(self, var: str) -> bool:
        user_env = config.project.user_env or []
        return var in os.environ or var in user_env

    def is_configured(self):
        for var in self.env_var:
            if not self._is_env_var_available(var):
                return False
        return True

    def require_prompt(self, request: CompletionRequest):
        if self.is_chat and not request.messages:
            raise ValueError("Chat LLM provider requires messages")
        elif not request.prompt:
            raise ValueError("No prompt provided")

    def require_settings(self, settings: Dict[str, Any]):
        for _input in self.inputs:
            if _input.id not in settings:
                raise ValueError(
                    f"Field {_input.id} is a required setting but is not found."
                )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "inputs": [input_widget.to_dict() for input_widget in self.inputs],
            "is_chat": self.is_chat,
        }
