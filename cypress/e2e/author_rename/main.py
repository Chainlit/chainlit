import chainlit as cl


@cl.author_rename
def rename(orig_author: str):
    rename_dict = {"LLMMathChain": "Albert Einstein", "Chatbot": "Assistant"}
    return rename_dict.get(orig_author, orig_author)


@cl.step
def LLMMathChain():
    return "2+2=4"


@cl.on_chat_start
async def main():
    await cl.Message(author="LLMMathChain", content="2+2=4").send()
    LLMMathChain()
    await cl.Message(content="The response is 4").send()
