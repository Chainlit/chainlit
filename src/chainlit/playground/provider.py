import os
from typing import Any, Dict, List, Union

from fastapi import HTTPException
from pydantic.dataclasses import dataclass

from chainlit import input_widget
from chainlit.config import config
from chainlit.telemetry import trace_event
from chainlit.types import CompletionRequest, PromptMessage


@dataclass
class BaseProvider:
    id: str
    name: str
    env_vars: Dict[str, str]
    inputs: List[input_widget.InputWidget]
    is_chat: bool

    def format_message(self, message: PromptMessage):
        return message

    def message_to_string(self, message: PromptMessage):
        return message.formatted

    def concatenate_messages(self, messages: List[PromptMessage]):
        return "".join([self.message_to_string(m) for m in messages])

    def create_prompt(self, request: CompletionRequest):
        if self.is_chat:
            if request.messages:
                return [self.format_message(m) for m in request.messages]
            elif request.prompt:
                return [
                    self.format_message(
                        PromptMessage(formatted=request.prompt, role="user")
                    )
                ]
            else:
                raise HTTPException(status_code=422, detail="Could not create prompt")
        else:
            if request.prompt:
                return request.prompt
            elif request.messages:
                return self.concatenate_messages(request.messages)
            else:
                raise HTTPException(status_code=422, detail="Could not create prompt")

    async def create_completion(self, request: CompletionRequest):
        trace_event("completion")

    def get_var(self, request: CompletionRequest, var: str) -> Union[str, None]:
        user_env = config.project.user_env or []

        if var in user_env:
            return request.userEnv.get(var)
        else:
            return os.environ.get(var)

    def _is_env_var_available(self, var: str) -> bool:
        user_env = config.project.user_env or []
        return var in os.environ or var in user_env

    def is_configured(self):
        for var in self.env_vars.values():
            if not self._is_env_var_available(var):
                return False
        return True

    def validate_env(self, request: CompletionRequest):
        return {k: self.get_var(request, v) for k, v in self.env_vars.items()}

    def require_prompt(self, request: CompletionRequest):
        if not request.prompt and not request.messages:
            raise HTTPException(
                status_code=422, detail="Chat LLM provider requires messages"
            )

    def require_settings(self, settings: Dict[str, Any]):
        for _input in self.inputs:
            if _input.id not in settings:
                raise HTTPException(
                    status_code=422,
                    detail=f"Field {_input.id} is a required setting but is not found.",
                )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "inputs": [input_widget.to_dict() for input_widget in self.inputs],
            "is_chat": self.is_chat,
        }
