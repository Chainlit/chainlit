import os
from typing import Optional

os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"  # nosec B105
os.environ["OAUTH_GITHUB_CLIENT_ID"] = "fake_client_id"  # nosec B105
os.environ["OAUTH_GITHUB_CLIENT_SECRET"] = "fake_client_secret"  # nosec B105

import chainlit as cl


@cl.oauth_callback
def oauth_callback(
    provider_id: str,
    token: str,
    raw_user_data: dict,
    default_user: cl.User,
) -> Optional[cl.User]:
    return default_user


@cl.on_chat_start
async def on_chat_start():
    await cl.Message("Hello").send()
