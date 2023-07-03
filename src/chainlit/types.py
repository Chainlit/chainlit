from typing import List, Any, TypedDict, Optional, Literal, Dict, Union
from pydantic import BaseModel
from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json

ElementType = Literal["image", "avatar", "text", "pdf", "tasklist", "audio"]
ElementDisplay = Literal["inline", "side", "page"]
ElementSize = Literal["small", "medium", "large"]


@dataclass_json
@dataclass
class AskSpec:
    """Specification for asking the user."""

    timeout: int
    type: Literal["text", "file"]


@dataclass_json
@dataclass
class AskFileSpec(AskSpec):
    """Specification for asking the user for a file."""

    accept: Union[List[str], Dict[str, List[str]]]
    max_files: int
    max_size_mb: int


class AskResponse(TypedDict):
    content: str
    author: str


@dataclass
class AskFileResponse:
    name: str
    path: str
    size: int
    type: str
    content: bytes


@dataclass_json
@dataclass
class LLMSettings:
    model_name: str = "text-davinci-003"
    stop: Optional[List[str]] = None
    temperature: float = 0
    max_tokens: int = 256
    top_p: int = 1
    frequency_penalty: int = 0
    presence_penalty: int = 0

    def to_settings_dict(self):
        return {
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty,
        }


class CompletionRequest(BaseModel):
    prompt: str
    userEnv: Dict[str, str]
    settings: LLMSettings


class UpdateFeedbackRequest(BaseModel):
    messageId: int
    feedback: int


class DeleteConversationRequest(BaseModel):
    conversationId: int


class Pagination(BaseModel):
    first: int
    cursor: Any


class ConversationFilter(BaseModel):
    feedback: Optional[Literal[-1, 0, 1]]
    authorEmail: Optional[str]
    search: Optional[str]


class GetConversationsRequest(BaseModel):
    pagination: Pagination
    filter: ConversationFilter
