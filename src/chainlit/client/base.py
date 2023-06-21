from typing import Dict, Any, TypedDict, Optional, Union
from abc import ABC, abstractmethod


from chainlit.types import ElementType, ElementSize, ElementDisplay


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


class ElementDict(TypedDict):
    id: Optional[int]
    type: ElementType
    url: str
    name: str
    display: ElementDisplay
    size: ElementSize
    language: str
    forId: Optional[Union[str, int]]


class BaseClient(ABC):
    project_id: str
    session_id: str

    @abstractmethod
    async def is_project_member(self, access_token: str) -> bool:
        pass

    @abstractmethod
    async def create_conversation(self, session_id: str) -> int:
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
    async def create_element(self, variables: ElementDict) -> Dict[str, Any]:
        pass
