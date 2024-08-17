from typing import Optional
from urllib.parse import parse_qs, urlparse

import chainlit as cl
from chainlit import logger


@cl.header_auth_callback
def header_auth_callback(headers) -> Optional[cl.User]:
    if headers.get("test-header"):
        return cl.User(identifier="admin")
    else:
        return None


@cl.on_chat_start
async def on_chat_start():
    user = cl.user_session.get("user")
    query_param = None
    if cl.user_session.get("http_referer"):
        try:
            parsed_url = urlparse(cl.user_session.get("http_referer"))
            query_params = parse_qs(parsed_url.query)

            query_param = query_params.get("q")

            if isinstance(query_param, list):
                query_param = query_param[0]

        except Exception as e:
            logger.warning({"msg": "Failed to parse http_referer", "error": str(e)})
    else:
        logger.warning({"msg": "http_referer is not set in user_session"})

    await cl.Message(f"Hello {user.identifier}, query param: {query_param}").send()
