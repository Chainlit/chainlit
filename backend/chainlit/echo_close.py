# This is a simple example of a chainlit app.

import chainlit as cl
from chainlit.session import WebsocketSession
from chainlit.emitter import ChainlitEmitter


@cl.on_chat_start
async def main():
    res = await cl.AskUserMessage(content="What is your name?", timeout=30).send()
    if res:
        await cl.Message(
            content=f"Your name is: {res['output']}.\nChainlit installation is working!\nYou can now start building your own chainlit apps!",
        ).send()

@cl.on_message
async def on_message(msg):
    text=msg.content
    reply= cl.Message(
        content=f"Echo: {text}",
    )
    await reply.send()
    if text=="close":
        wsid=cl.user_session.get("id")
        cl.logger.info(f"Closing websocket {wsid}")
        ws_session = WebsocketSession.get_by_id(wsid)
        emit=ChainlitEmitter(ws_session)
        await emit.send_reload()


@cl.on_chat_restore 
async def restore():
    await Message(
        content="Welcome back",
    ).send()