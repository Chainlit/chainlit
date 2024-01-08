import os
from typing import Any, Dict, List, Optional, Union

from chainlit.config import config
from chainlit.telemetry import trace_event
from chainlit.types import GenerationRequest
from fastapi import HTTPException
from literalai import BaseGeneration, ChatGeneration, GenerationMessage
from pydantic.dataclasses import dataclass

from chainlit import input_widget


@dataclass
class BaseProvider:
    id: str
    name: str
    env_vars: Dict[str, str]
    inputs: List[input_widget.InputWidget]
    is_chat: bool

    # Format the message based on the template provided
    def format_message(self, message: GenerationMessage, inputs: Optional[Dict]):
        if message.template:
            message.formatted = self._format_template(
                message.template, inputs, message.template_format
            )
        return message

    # Convert the message to string format
    def message_to_string(self, message: GenerationMessage):
        return message.formatted

    # Concatenate multiple messages with a joiner
    def concatenate_messages(self, messages: List[GenerationMessage], joiner="\n\n"):
        return joiner.join([self.message_to_string(m) for m in messages])

    # Format the template based on the prompt inputs
    def _format_template(
        self, template: str, inputs: Optional[Dict], format: str = "f-string"
    ):
        if format == "f-string":
            return template.format(**(inputs or {}))
        raise HTTPException(status_code=422, detail=f"Unsupported format {format}")

    # Create a prompt based on the request
    def create_generation(self, request: GenerationRequest):
        if request.chatGeneration and request.chatGeneration.messages:
            messages = [
                self.format_message(m, request.chatGeneration.inputs)
                for m in request.chatGeneration.messages
            ]
        else:
            messages = None

        if self.is_chat:
            if messages:
                return messages
            elif request.completionGeneration and (
                request.completionGeneration.template
                or request.completionGeneration.formatted
            ):
                return [
                    self.format_message(
                        GenerationMessage(
                            template=request.completionGeneration.template,
                            formatted=request.completionGeneration.formatted,
                            role="user",
                        ),
                        inputs=request.completionGeneration.inputs,
                    )
                ]
            else:
                raise HTTPException(
                    status_code=422, detail="Could not create generation"
                )
        else:
            if request.completionGeneration:
                if request.completionGeneration.template:
                    return self._format_template(
                        request.completionGeneration.template,
                        request.completionGeneration.inputs,
                        request.completionGeneration.template_format,
                    )
                elif request.completionGeneration.formatted:
                    return request.completionGeneration.formatted
            elif messages:
                return self.concatenate_messages(messages)
            else:
                raise HTTPException(status_code=422, detail="Could not create prompt")

    # Create a completion event
    async def create_completion(self, request: GenerationRequest):
        trace_event("completion")

    # Get the environment variable based on the request
    def get_var(self, request: GenerationRequest, var: str) -> Union[str, None]:
        user_env = config.project.user_env or []

        if var in user_env:
            return request.userEnv.get(var)
        else:
            return os.environ.get(var)

    # Check if the environment variable is available
    def _is_env_var_available(self, var: str) -> bool:
        user_env = config.project.user_env or []
        return var in os.environ or var in user_env

    # Check if the provider is configured
    def is_configured(self):
        for var in self.env_vars.values():
            if not self._is_env_var_available(var):
                return False
        return True

    # Validate the environment variables in the request
    def validate_env(self, request: GenerationRequest):
        return {k: self.get_var(request, v) for k, v in self.env_vars.items()}

    # Check if the required settings are present
    def require_settings(self, settings: Dict[str, Any]):
        for _input in self.inputs:
            if _input.id not in settings:
                raise HTTPException(
                    status_code=422,
                    detail=f"Field {_input.id} is a required setting but is not found.",
                )

    # Convert the provider to dictionary format
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "inputs": [input_widget.to_dict() for input_widget in self.inputs],
            "is_chat": self.is_chat,
        }
