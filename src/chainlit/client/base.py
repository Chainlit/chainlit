from abc import ABC, abstractmethod
from typing import (
    Any,
    Dict,
    Generic,
    List,
    Literal,
    Optional,
    TypedDict,
    TypeVar,
    Union,
)

from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import dataclass
from starlette.datastructures import Headers

from chainlit.prompt import Prompt
from chainlit.types import (
    ConversationFilter,
    ElementDisplay,
    ElementSize,
    ElementType,
    Pagination,
)


class MessageDict(TypedDict):
    conversationId: Optional[str]
    id: str
    createdAt: Optional[int]
    content: str
    author: str
    prompt: Optional[Prompt]
    language: Optional[str]
    parentId: Optional[str]
    indent: Optional[int]
    authorIsUser: Optional[bool]
    waitForAnswer: Optional[bool]
    isError: Optional[bool]
    humanFeedback: Optional[int]


class UserDict(TypedDict):
    id: int
    name: Optional[str]
    email: Optional[str]
    role: str


class ElementDict(TypedDict):
    id: str
    conversationId: Optional[str]
    type: ElementType
    url: str
    objectKey: Optional[str]
    name: str
    display: ElementDisplay
    size: Optional[ElementSize]
    language: Optional[str]
    forIds: Optional[List[str]]


class ConversationDict(TypedDict):
    id: Optional[str]
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


@dataclass
class PaginatedResponse(DataClassJsonMixin, Generic[T]):
    pageInfo: PageInfo
    data: List[T]


class BaseAuthClient(ABC):
    user_infos: Optional[UserDict] = None
    handshake_headers: Optional[Dict[str, str]] = None
    request_headers: Optional[Headers] = None

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
    async def create_conversation(self) -> Optional[str]:
        pass

    @abstractmethod
    async def delete_conversation(self, conversation_id: str) -> bool:
        pass

    @abstractmethod
    async def get_conversation(self, conversation_id: str) -> ConversationDict:
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
    async def create_message(self, variables: MessageDict) -> Optional[str]:
        pass

    @abstractmethod
    async def update_message(self, message_id: str, variables: MessageDict) -> bool:
        pass

    @abstractmethod
    async def delete_message(self, message_id: str) -> bool:
        pass

    @abstractmethod
    async def upload_element(self, content: Union[bytes, str], mime: str) -> Dict:
        pass

    @abstractmethod
    async def create_element(self, variables: ElementDict) -> ElementDict:
        pass

    @abstractmethod
    async def update_element(self, variables: ElementDict) -> ElementDict:
        pass

    @abstractmethod
    async def get_element(self, conversation_id: str, element_id: str) -> ElementDict:
        pass

    @abstractmethod
    async def set_human_feedback(
        self, message_id: str, feedback: Literal[-1, 0, 1]
    ) -> bool:
        pass
