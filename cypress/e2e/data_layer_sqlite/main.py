from typing import List, Optional

import chainlit.data as cl_data
from chainlit.data.sqlite import SQLiteDataLayer
from literalai.helper import utc_now

import chainlit as cl

cl_data._data_layer = SQLiteDataLayer()


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
