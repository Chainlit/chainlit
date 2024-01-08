from enum import Enum
from typing import TYPE_CHECKING, Dict, List, Literal, Optional, TypedDict, Union

if TYPE_CHECKING:
    from chainlit.element import ElementDict
    from chainlit.user import UserDict
    from chainlit.step import StepDict

from dataclasses_json import DataClassJsonMixin
from literalai import ChatGeneration, CompletionGeneration
from pydantic import BaseModel
from pydantic.dataclasses import dataclass

InputWidgetType = Literal[
    "switch", "slider", "select", "textinput", "tags", "numberinput"
]


class ThreadDict(TypedDict):
    id: str
    createdAt: str
    user: Optional["UserDict"]
    tags: Optional[List[str]]
    metadata: Optional[Dict]
    steps: List["StepDict"]
    elements: Optional[List["ElementDict"]]


class Pagination(BaseModel):
    first: int
    cursor: Optional[str] = None


class ThreadFilter(BaseModel):
    feedback: Optional[Literal[-1, 0, 1]] = None
    userIdentifier: Optional[str] = None
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


class FileReference(TypedDict):
    id: str


class FileDict(TypedDict):
    id: str
    name: str
    path: str
    size: int
    type: str


class UIMessagePayload(TypedDict):
    message: "StepDict"
    fileReferences: Optional[List[FileReference]]


@dataclass
class AskFileResponse:
    id: str
    name: str
    path: str
    size: int
    type: str


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


FeedbackStrategy = Literal["BINARY"]


class FeedbackDict(TypedDict):
    value: Literal[-1, 0, 1]
    strategy: FeedbackStrategy
    comment: Optional[str]


@dataclass
class Feedback:
    forId: str
    value: Literal[-1, 0, 1]
    strategy: FeedbackStrategy = "BINARY"
    id: Optional[str] = None
    comment: Optional[str] = None


class UpdateFeedbackRequest(BaseModel):
    feedback: Feedback
