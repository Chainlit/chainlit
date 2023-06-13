import chainlit as cl

token_list = ["the", "quick", "brown", "fox"]


@cl.on_chat_start
async def main():
    msg = cl.Message(content="")
    for token in token_list:
        await msg.stream_token(token)
        await cl.sleep(2)

    await msg.send()
