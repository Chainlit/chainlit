from chainlit.client.base import BaseClient
import chainlit as cl


class CustomClient(BaseClient):
    def __init__(self, session_id: str):
        self.session_id = session_id

    async def is_project_member(self, access_token):
        raise NotImplementedError()

    async def create_conversation(self, session_id):
        raise NotImplementedError()

    async def get_message(self, conversation_id, message_id):
        raise NotImplementedError()

    async def create_message(self, variables):
        raise NotImplementedError()

    async def delete_message(self, message_id):
        raise NotImplementedError()

    async def update_message(self, message_id, variables):
        raise NotImplementedError()

    async def create_element(self, variables):
        raise NotImplementedError()

    async def upload_element(self, content, mime):
        raise NotImplementedError()


@cl.client_factory
async def client_factory(session_id: str):
    return CustomClient(session_id)


@cl.on_chat_start
async def on_chat_start():
    await cl.Message("Hello").send()
