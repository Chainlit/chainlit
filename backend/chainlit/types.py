from enum import Enum
from typing import Any, Dict, List, Literal, Optional, TypedDict, Union

from chainlit.prompt import Prompt
from dataclasses_json import DataClassJsonMixin
from pydantic import BaseModel
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
    authorEmail: Optional[str]
    search: Optional[str]


class GetConversationsRequest(BaseModel):
    pagination: Pagination
    filter: ConversationFilter


class Theme(str, Enum):
    light = "light"
    dark = "dark"


Role = Literal["USER", "ADMIN", "OWNER", "ANONYMOUS"]
Provider = Literal["credentials", "header"]


# Used when logging-in a user
class UserDetails:
    id: str
    username: str
    role: Role
    tags: Optional[List[str]]
    image: Optional[str]
    provider: Optional[Provider]

    def __init__(
        self,
        id: str,
        role: Role,
        username: Optional[str] = None,
        tags: Optional[List[str]] = None,
        image: Optional[str] = None,
        provider: Optional[Provider] = None,
    ):
        self.id = id
        self.username = id if username is None or username == "" else username
        self.role = role
        self.tags = tags
        self.image = image
        self.provider = provider

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "tags": self.tags,
            "image": self.image,
            "provider": self.provider,
        }
