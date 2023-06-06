from langchain import OpenAI, LLMChain, PromptTemplate
import chainlit as cl

prompt_template = "What is a good name for a company that makes {product}?"


@cl.langchain_factory(use_async=True)
def main():
    llm = OpenAI(temperature=0)
    chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template(prompt_template))
    return chain
