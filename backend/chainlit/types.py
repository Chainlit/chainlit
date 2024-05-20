from enum import Enum
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    Generic,
    List,
    Literal,
    Optional,
    Protocol,
    TypedDict,
    TypeVar,
    Union,
)

if TYPE_CHECKING:
    from chainlit.element import ElementDict
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
    name: Optional[str]
    userId: Optional[str]
    userIdentifier: Optional[str]
    tags: Optional[List[str]]
    metadata: Optional[Dict]
    steps: List["StepDict"]
    elements: Optional[List["ElementDict"]]


class Pagination(BaseModel):
    first: int
    cursor: Optional[str] = None


class ThreadFilter(BaseModel):
    feedback: Optional[Literal[0, 1]] = None
    userId: Optional[str] = None
    search: Optional[str] = None


@dataclass
class PageInfo:
    hasNextPage: bool
    startCursor: Optional[str]
    endCursor: Optional[str]

    def to_dict(self):
        return {
            "hasNextPage": self.hasNextPage,
            "startCursor": self.startCursor,
            "endCursor": self.endCursor,
        }

    @classmethod
    def from_dict(cls, page_info_dict: Dict) -> "PageInfo":
        hasNextPage = page_info_dict.get("hasNextPage", False)
        startCursor = page_info_dict.get("startCursor", None)
        endCursor = page_info_dict.get("endCursor", None)
        return cls(
            hasNextPage=hasNextPage, startCursor=startCursor, endCursor=endCursor
        )


T = TypeVar("T", covariant=True)


class HasFromDict(Protocol[T]):
    @classmethod
    def from_dict(cls, obj_dict: Any) -> T:
        raise NotImplementedError()


@dataclass
class PaginatedResponse(Generic[T]):
    pageInfo: PageInfo
    data: List[T]

    def to_dict(self):
        return {
            "pageInfo": self.pageInfo.to_dict(),
            "data": [
                (d.to_dict() if hasattr(d, "to_dict") and callable(d.to_dict) else d)
                for d in self.data
            ],
        }

    @classmethod
    def from_dict(
        cls, paginated_response_dict: Dict, the_class: HasFromDict[T]
    ) -> "PaginatedResponse[T]":
        pageInfo = PageInfo.from_dict(paginated_response_dict.get("pageInfo", {}))

        data = [the_class.from_dict(d) for d in paginated_response_dict.get("data", [])]

        return cls(pageInfo=pageInfo, data=data)


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
    path: Path
    size: int
    type: str


class UIMessagePayload(TypedDict):
    message: "StepDict"
    fileReferences: Optional[List[FileReference]]


class AudioChunkPayload(TypedDict):
    isStart: bool
    mimeType: str
    elapsedTime: float
    data: bytes


@dataclass
class AudioChunk:
    isStart: bool
    mimeType: str
    elapsedTime: float
    data: bytes


class AudioEndPayload(TypedDict):
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


class DeleteFeedbackRequest(BaseModel):
    feedbackId: str


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
    default: bool = False


FeedbackStrategy = Literal["BINARY"]


class FeedbackDict(TypedDict):
    forId: str
    id: Optional[str]
    value: Literal[0, 1]
    comment: Optional[str]


@dataclass
class Feedback:
    forId: str
    threadId: Optional[str]
    value: Literal[0, 1]
    id: Optional[str] = None
    comment: Optional[str] = None


class UpdateFeedbackRequest(BaseModel):
    feedback: Feedback
