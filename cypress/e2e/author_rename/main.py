from langchain import LLMMathChain, OpenAI

import chainlit as cl
from chainlit.langchain.callbacks import AsyncLangchainCallbackHandler


@cl.author_rename
def rename(orig_author: str):
    rename_dict = {"LLMMathChain": "Albert Einstein", "Chatbot": "Assistant"}
    return rename_dict.get(orig_author, orig_author)


@cl.on_message
async def main(message: str):
    llm = OpenAI(temperature=0)
    llm_math = LLMMathChain.from_llm(llm=llm)
    res = await llm_math.acall(message, callbacks=[AsyncLangchainCallbackHandler()])

    await cl.Message(content="Hello").send()
