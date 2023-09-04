from typing import Any, Dict, List, Literal, Optional

from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import dataclass


@dataclass
class BaseTemplate(DataClassJsonMixin):
    template: Optional[str] = None
    formatted: Optional[str] = None
    template_format: Optional[str] = "f-string"


@dataclass
class PromptMessage(BaseTemplate):
    # This is used for Langchain's MessagesPlaceholder
    placeholder_size: Optional[int] = None
    # This is used for OpenAI's function message
    name: Optional[str] = None
    role: Optional[Literal["system", "assistant", "user", "function"]] = None

    def to_openai(self):
        msg_dict = {"role": self.role, "content": self.formatted}
        if self.role == "function":
            msg_dict["name"] = self.name or ""
        return msg_dict

    def to_string(self):
        return f"{self.role}: {self.formatted}"


@dataclass
class Prompt(BaseTemplate):
    provider: Optional[str] = None
    id: Optional[str] = None
    inputs: Optional[Dict[str, str]] = None
    completion: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    messages: Optional[List[PromptMessage]] = None
