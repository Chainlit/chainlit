import chainlit as cl

token_list = ["the ", "quick ", "brown ", "fox"]

sequence_list = ["the", "the quick", "the quick brown", "the quick brown fox"]


@cl.on_chat_start
async def main():
    msg = cl.Message(content="")
    for token in token_list:
        await msg.stream_token(token)
        await cl.sleep(0.2)

    await msg.send()

    msg = cl.Message(content="")
    for seq in sequence_list:
        await msg.stream_token(token=seq, is_sequence=True)
        await cl.sleep(0.2)

    await msg.send()

    step = cl.Step(type="tool", name="tool1")
    for token in token_list:
        await step.stream_token(token)
        await cl.sleep(0.2)

    await step.send()
