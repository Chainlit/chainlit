from langchain import OpenAI, LLMChain, PromptTemplate
import chainlit as cl

prompt_template = "{input}?"


@cl.langchain_factory(use_async=False)
async def main():
    llm = OpenAI(temperature=0)
    chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template(prompt_template))
    return chain


@cl.langchain_run
async def run(agent, input_str):
    res = await cl.make_async(agent)(
        input_str, callbacks=[cl.LangchainCallbackHandler()]
    )
    await cl.Message(content=res["text"]).send()
