from typing import Literal, Dict

import chainlit as cl
from chainlit.client.base import (
    BaseDBClient,
    ConversationDict,
    Pagination,
    ConversationFilter,
    PaginatedResponse,
    MessageDict,
    ElementDict,
)


class CustomClient(BaseDBClient):
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

    async def upload_element(self, content: bytes, mime: str) -> str:
        raise NotImplementedError

    async def upsert_element(self, variables: ElementDict) -> ElementDict:
        raise NotImplementedError

    async def get_element(self, conversation_id: int, element_id: int) -> ElementDict:
        raise NotImplementedError

    async def set_human_feedback(
        self, message_id: int, feedback: Literal[-1, 0, 1]
    ) -> bool:
        raise NotImplementedError


@cl.client_factory
async def client_factory():
    return CustomClient()


@cl.on_chat_start
async def on_chat_start():
    await cl.Message("Hello").send()
