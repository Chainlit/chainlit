from chainlit.client.base import BaseClient
import chainlit as cl


class CustomClient(BaseClient):
    async def is_project_member(self, access_token):
        raise NotImplementedError()

    async def get_member_role(self, access_token):
        raise NotImplementedError()

    async def get_project_members(self):
        raise NotImplementedError()

    async def create_conversation(self):
        raise NotImplementedError()

    async def delete_conversation(self, conversation_id):
        raise NotImplementedError()

    async def get_conversation(self, conversation_id):
        raise NotImplementedError()

    async def get_conversations(self):
        raise NotImplementedError()

    async def set_human_feedback(self, message_id, feedback):
        raise NotImplementedError()

    async def get_message(self, conversation_id, message_id):
        raise NotImplementedError()

    async def create_message(self, variables):
        raise NotImplementedError()

    async def delete_message(self, message_id):
        raise NotImplementedError()

    async def get_element(self, conversation_id, element_id):
        raise NotImplementedError()

    async def update_message(self, message_id, variables):
        raise NotImplementedError()

    async def upsert_element(self, variables):
        raise NotImplementedError()

    async def upload_element(self, content, mime):
        raise NotImplementedError()


@cl.client_factory
async def client_factory():
    return CustomClient()


@cl.on_chat_start
async def on_chat_start():
    await cl.Message("Hello").send()
