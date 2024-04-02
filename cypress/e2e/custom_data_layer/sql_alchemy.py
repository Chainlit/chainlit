from typing import List, Optional

import chainlit.data as cl_data
from chainlit.data.sql_alchemy import SQLAlchemyDataLayer
from chainlit.data.storage_clients import AzureStorageClient
from literalai.helper import utc_now

import chainlit as cl

storage_client = AzureStorageClient(account_url="<your_account_url>", container="<your_container>")

cl_data._data_layer = SQLAlchemyDataLayer(conninfo="<your conninfo>", storage_provider=storage_client)


@cl.on_chat_start
async def main():
    await cl.Message("Hello, send me a message!", disable_feedback=True).send()


@cl.on_message
async def handle_message():
    await cl.sleep(2)
    await cl.Message("Ok!").send()


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin")
    else:
        return None
