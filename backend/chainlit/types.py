from enum import Enum
from typing import Dict, List, Literal, Optional, TypedDict, Union

from chainlit.client.base import ConversationFilter, MessageDict, Pagination
from chainlit.element import File
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
class ActionSpec(DataClassJsonMixin):
    keys: List[str]


@dataclass
class AskSpec(DataClassJsonMixin):
    """Specification for asking the user."""

    timeout: int
    type: Literal["text", "file", "action"]


@dataclass
class AskFileSpec(FileSpec, AskSpec, DataClassJsonMixin):
    """Specification for asking the user a file."""


@dataclass
class AskActionSpec(ActionSpec, AskSpec, DataClassJsonMixin):
    """Specification for asking the user an action"""


class AskResponse(TypedDict):
    content: str
    author: str


class UIMessagePayload(TypedDict):
    message: MessageDict
    files: Optional[List[Dict]]


@dataclass
class AskFileResponse:
    name: str
    path: str
    size: int
    type: str
    content: bytes


class AskActionResponse(TypedDict):
    name: str
    value: str
    label: str
    description: str
    forId: str
    id: str
    collapsed: bool


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


@dataclass
class ChatProfile(DataClassJsonMixin):
    """Specification for a chat profile that can be chosen by the user at the conversation start."""

    name: str
    markdown_description: str
    icon: Optional[str] = None
