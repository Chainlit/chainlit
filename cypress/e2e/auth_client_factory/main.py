import chainlit as cl
from chainlit.client.base import BaseAuthClient, UserDict


class CustomAuthClient(BaseAuthClient):
    async def is_project_member(self) -> bool:
        raise ConnectionRefusedError

    async def get_user_infos(self) -> UserDict:
        raise ConnectionRefusedError


@cl.auth_client_factory
async def auth_client_factory(handshake_headers, request_headers):
    return CustomAuthClient()


@cl.on_chat_start
async def on_chat_start():
    await cl.Message("Hello").send()
