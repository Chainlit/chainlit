from langchain import OpenAI, LLMMathChain
import chainlit as cl

@cl.langchain_rename
def rename(orig_author: str):
    rename_dict = {
        "LLMMathChain": "Albert Einstein"
    }

    return rename_dict.get(orig_author, orig_author)

@cl.langchain_factory
def load():
    llm = OpenAI(temperature=0)
    llm_math = LLMMathChain(llm=llm)
    return llm_math