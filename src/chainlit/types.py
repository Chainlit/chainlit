from typing import Any, Dict, List, Literal, Optional, TypedDict, Union

from dataclasses_json import DataClassJsonMixin
from pydantic import BaseModel
from pydantic.dataclasses import dataclass

from chainlit.prompt import Prompt

InputWidgetType = Literal[
    "switch", "slider", "select", "textinput", "tags", "numberinput"
]
ElementType = Literal[
    "image", "avatar", "text", "pdf", "tasklist", "audio", "video", "file"
]
ElementDisplay = Literal["inline", "side", "page"]
ElementSize = Literal["small", "medium", "large"]


@dataclass
class FileSpec(DataClassJsonMixin):
    accept: Union[List[str], Dict[str, List[str]]]
    max_files: int
    max_size_mb: int


@dataclass
class AskSpec(DataClassJsonMixin):
    """Specification for asking the user."""

    timeout: int
    type: Literal["text", "file"]


@dataclass
class AskFileSpec(FileSpec, AskSpec, DataClassJsonMixin):
    """Specification for asking the user a file."""


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


class CompletionRequest(BaseModel):
    prompt: Prompt
    userEnv: Dict[str, str]


class UpdateFeedbackRequest(BaseModel):
    messageId: str
    feedback: Literal[-1, 0, 1]


class DeleteConversationRequest(BaseModel):
    conversationId: str


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
