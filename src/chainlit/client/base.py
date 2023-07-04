from typing import (
    Dict,
    Any,
    List,
    TypedDict,
    Optional,
    Union,
    Literal,
    TypeVar,
    Generic,
)

from abc import ABC, abstractmethod
from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json

from chainlit.types import (
    Pagination,
    ConversationFilter,
    ElementType,
    ElementSize,
    ElementDisplay,
)


class MessageDict(TypedDict):
    conversationId: Optional[str]
    id: Optional[int]
    tempId: Optional[str]
    createdAt: Optional[int]
    content: str
    author: str
    prompt: Optional[str]
    llmSettings: Dict
    language: Optional[str]
    indent: Optional[int]
    authorIsUser: Optional[bool]
    waitForAnswer: Optional[bool]
    isError: Optional[bool]
    humanFeedback: Optional[int]


class UserDict(TypedDict):
    id: Optional[int]
    name: Optional[str]
    email: Optional[str]
    role: str


class ElementDict(TypedDict):
    id: Optional[int]
    conversationId: Optional[int]
    type: ElementType
    url: str
    name: str
    display: ElementDisplay
    size: ElementSize
    language: str
    forIds: Optional[List[Union[str, int]]]


class ConversationDict(TypedDict):
    id: Optional[int]
    createdAt: Optional[int]
    elementCount: Optional[int]
    messageCount: Optional[int]
    author: Optional[UserDict]
    messages: List[MessageDict]
    elements: Optional[List[ElementDict]]


@dataclass
class PageInfo:
    hasNextPage: bool
    endCursor: Any


T = TypeVar("T")


@dataclass_json
@dataclass
class PaginatedResponse(Generic[T]):
    pageInfo: PageInfo
    data: List[T]


class BaseAuthClient(ABC):
    user_infos: Optional[UserDict] = None
    access_token: Optional[str] = None

    @abstractmethod
    async def is_project_member(self) -> bool:
        pass

    @abstractmethod
    async def get_user_infos(self) -> UserDict:
        pass


class BaseDBClient(ABC):
    user_infos: Optional[UserDict] = None

    @abstractmethod
    async def create_user(self, variables: UserDict) -> bool:
        pass

    @abstractmethod
    async def get_project_members(self) -> List[UserDict]:
        pass

    @abstractmethod
    async def create_conversation(self) -> int:
        pass

    @abstractmethod
    async def delete_conversation(self, conversation_id: int) -> bool:
        pass

    @abstractmethod
    async def get_conversation(self, conversation_id: int) -> ConversationDict:
        pass

    @abstractmethod
    async def get_conversations(
        self, pagination: "Pagination", filter: "ConversationFilter"
    ) -> PaginatedResponse[ConversationDict]:
        pass

    @abstractmethod
    async def get_message(self, conversation_id: str, message_id: str) -> Dict:
        pass

    @abstractmethod
    async def create_message(self, variables: MessageDict) -> int:
        pass

    @abstractmethod
    async def update_message(self, message_id: int, variables: MessageDict) -> bool:
        pass

    @abstractmethod
    async def delete_message(self, message_id: int) -> bool:
        pass

    @abstractmethod
    async def upload_element(self, content: bytes, mime: str) -> str:
        pass

    @abstractmethod
    async def upsert_element(self, variables: ElementDict) -> ElementDict:
        pass

    @abstractmethod
    async def get_element(self, conversation_id: int, element_id: int) -> ElementDict:
        pass

    @abstractmethod
    async def set_human_feedback(
        self, message_id: int, feedback: Literal[-1, 0, 1]
    ) -> bool:
        pass
