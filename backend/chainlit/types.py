from enum import Enum
from typing import (
    TYPE_CHECKING,
    Dict,
    Generic,
    List,
    Literal,
    Optional,
    TypedDict,
    TypeVar,
    Union,
)

if TYPE_CHECKING:
    from chainlit.message import MessageDict
    from chainlit.element import ElementDict
    from chainlit.user import AppUserDict

from chainlit_client import ChatGeneration, CompletionGeneration
from dataclasses_json import DataClassJsonMixin
from pydantic import BaseModel
from pydantic.dataclasses import dataclass

InputWidgetType = Literal[
    "switch", "slider", "select", "textinput", "tags", "numberinput"
]


class ThreadDict(TypedDict):
    id: Optional[str]
    tags: Optional[List[str]]
    metadata: Optional[Dict]
    createdAt: Optional[str]
    user: Optional[AppUserDict]
    messages: List[MessageDict]
    elements: Optional[List[ElementDict]]


@dataclass
class PageInfo:
    hasNextPage: bool
    endCursor: Optional[str]


T = TypeVar("T")


@dataclass
class PaginatedResponse(DataClassJsonMixin, Generic[T]):
    pageInfo: PageInfo
    data: List[T]


class Pagination(BaseModel):
    first: int
    cursor: Optional[str] = None


class ThreadFilter(BaseModel):
    feedback: Optional[Literal[-1, 0, 1]] = None
    username: Optional[str] = None
    search: Optional[str] = None


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
    message: "MessageDict"
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


class GenerationRequest(BaseModel):
    chatGeneration: Optional[ChatGeneration] = None
    completionGeneration: Optional[CompletionGeneration] = None
    userEnv: Dict[str, str]

    @property
    def generation(self):
        if self.chatGeneration:
            return self.chatGeneration
        return self.completionGeneration

    def is_chat(self):
        return self.chatGeneration is not None


class UpdateFeedbackRequest(BaseModel):
    messageId: str
    feedback: Literal[-1, 0, 1]
    feedbackComment: Optional[str] = None


class DeleteThreadRequest(BaseModel):
    threadId: str


class GetThreadsRequest(BaseModel):
    pagination: Pagination
    filter: ThreadFilter


class Theme(str, Enum):
    light = "light"
    dark = "dark"


@dataclass
class ChatProfile(DataClassJsonMixin):
    """Specification for a chat profile that can be chosen by the user at the thread start."""

    name: str
    markdown_description: str
    icon: Optional[str] = None
