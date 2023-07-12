import chainlit as cl
from chainlit.server import app
from fastapi.responses import (
    HTMLResponse,
)


@app.get("/hello")
def hello():
    return HTMLResponse("Hello World")


@cl.on_chat_start
async def main():
    await cl.Message(content="Hello!").send()
