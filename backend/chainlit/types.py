from enum import Enum
from typing import Any, Dict, List, Literal, Optional, TypedDict, Union

from chainlit.prompt import Prompt
from dataclasses_json import DataClassJsonMixin
from pydantic import BaseModel, Field
from pydantic.dataclasses import dataclass

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
    username: Optional[str]
    search: Optional[str]


class GetConversationsRequest(BaseModel):
    pagination: Pagination
    filter: ConversationFilter


class Theme(str, Enum):
    light = "light"
    dark = "dark"


Role = Literal["USER", "ADMIN", "OWNER", "ANONYMOUS"]
Provider = Literal["credentials", "header", "github", "google", "azure-ad"]


# Used when logging-in a user
@dataclass
class AppUser(DataClassJsonMixin):
    username: str
    role: Role = "USER"
    tags: List[str] = Field(default_factory=list)
    image: Optional[str] = None
    provider: Optional[Provider] = None


@dataclass
class PersistedAppUserFields:
    id: str
    createdAt: int


@dataclass
class PersistedAppUser(AppUser, PersistedAppUserFields):
    pass
