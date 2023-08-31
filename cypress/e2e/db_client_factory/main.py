from typing import Dict, List, Literal, Union

import chainlit as cl
from chainlit.client.base import (
    BaseDBClient,
    ConversationDict,
    ConversationFilter,
    ElementDict,
    MessageDict,
    PaginatedResponse,
    Pagination,
    UserDict,
)


class CustomDBClient(BaseDBClient):
    async def create_user(self, variables: UserDict) -> bool:
        raise NotImplementedError

    async def get_project_members(self) -> List[UserDict]:
        raise NotImplementedError

    async def create_conversation(self) -> int:
        raise NotImplementedError

    async def delete_conversation(self, conversation_id: int) -> bool:
        raise NotImplementedError

    async def get_conversation(self, conversation_id: int) -> ConversationDict:
        raise NotImplementedError

    async def get_conversations(
        self, pagination: "Pagination", filter: "ConversationFilter"
    ) -> PaginatedResponse[ConversationDict]:
        raise NotImplementedError

    async def get_message(self, conversation_id: str, message_id: str) -> Dict:
        raise NotImplementedError

    async def create_message(self, variables: MessageDict) -> int:
        raise NotImplementedError

    async def update_message(self, message_id: int, variables: MessageDict) -> bool:
        raise NotImplementedError

    async def delete_message(self, message_id: int) -> bool:
        raise NotImplementedError

    async def upload_element(self, content: Union[bytes, str], mime: str) -> Dict:
        raise NotImplementedError

    async def create_element(self, variables: ElementDict) -> ElementDict:
        raise NotImplementedError

    async def update_element(self, variables: ElementDict) -> ElementDict:
        raise NotImplementedError

    async def get_element(self, conversation_id: int, element_id: int) -> ElementDict:
        raise NotImplementedError

    async def set_human_feedback(
        self, message_id: str, feedback: Literal[-1, 0, 1]
    ) -> bool:
        raise NotImplementedError


@cl.db_client_factory
async def db_client_factory(handshake_headers, request_headers, user_infos):
    return CustomDBClient()


@cl.on_chat_start
async def on_chat_start():
    msg = cl.Message(content="Hello")
    msg.fail_on_persist_error = True
    await msg.send()
