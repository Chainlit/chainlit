from enum import Enum
from typing import Dict, List, Literal, Optional, TypedDict, Union

from chainlit.client.base import ConversationFilter, Pagination
from chainlit.prompt import Prompt
from dataclasses_json import DataClassJsonMixin
from pydantic import BaseModel
from pydantic.dataclasses import dataclass

InputWidgetType = Literal[
    "switch", "slider", "select", "textinput", "tags", "numberinput"
]


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
    feedbackComment: Optional[str] = None


class DeleteConversationRequest(BaseModel):
    conversationId: str


class GetConversationsRequest(BaseModel):
    pagination: Pagination
    filter: ConversationFilter


class Theme(str, Enum):
    light = "light"
    dark = "dark"
