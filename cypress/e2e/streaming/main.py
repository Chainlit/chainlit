import chainlit as cl

token_list = ["the", "quick", "brown", "fox"]


@cl.on_chat_start
def main():
    msg = cl.Message(content="")
    for token in token_list:
        msg.stream_token(token)
        cl.sleep(2)

    msg.send()
