import os
from uuid import uuid4

from fastapi import Request, Response

import chainlit as cl
from chainlit.auth import create_jwt
from chainlit.server import _authenticate_user, app
from chainlit.user import User

os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"  # nosec B105
os.environ["CHAINLIT_CUSTOM_AUTH"] = "true"


@app.get("/auth/custom")
async def custom_auth(request: Request) -> Response:
    user_id = str(uuid4())

    user = User(identifier=user_id, metadata={"role": "user"})
    response = await _authenticate_user(request, user)

    return response


@app.get("/auth/token")
async def custom_token_auth() -> Response:
    user_id = str(uuid4())

    user = User(identifier=user_id, metadata={"role": "admin"})
    response = create_jwt(user)

    return response


# Chainlit's catch-all SPA route (`/{full_path:path}`) matches every path
# and Starlette dispatch is first-match-wins, so without reordering it would
# shadow the custom routes above. Move the custom routes to the very front
# of app.routes instead of trying to relocate the catch-all itself — this
# works whether the catch-all is a top-level route or (fastapi >= 0.141)
# nested inside an internal router-include wrapper.
_custom_paths = {"/auth/custom", "/auth/token"}
_custom_routes = [r for r in app.routes if getattr(r, "path", None) in _custom_paths]
for _route in _custom_routes:
    app.routes.remove(_route)
app.routes[:0] = _custom_routes


@cl.on_chat_start
async def on_chat_start():
    user = cl.user_session.get("user")
    await cl.Message(f"Hello {user.identifier}").send()


@cl.on_message
async def on_message(msg: cl.Message):
    await cl.Message(content=f"Echo: {msg.content}").send()
