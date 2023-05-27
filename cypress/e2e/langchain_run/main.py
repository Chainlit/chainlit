from langchain import OpenAI, LLMChain, PromptTemplate
import chainlit as cl

prompt_template = "{input}?"


@cl.langchain_factory
def main():
    llm = OpenAI(temperature=0)
    chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template(prompt_template))
    return chain


@cl.langchain_run
def run(agent, input_str):
    res = agent("2+2")
    cl.Message(content=res["text"]).send()
