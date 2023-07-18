import chainlit as cl
from langchain.schema import SystemMessage, LLMResult, Generation


@cl.on_chat_start
async def main():
    await cl.Message(content="AsyncLangchainCb").send()

    cb = cl.LangchainCallbackHandler()

    cb.on_chain_start(serialized={"id": ["TestChain1"]}, inputs={})

    cb.on_chat_model_start(
        serialized={}, messages=[[SystemMessage(content="This is prompt of llm1")]]
    )
    cb.on_llm_end(
        response=LLMResult(
            generations=[[Generation(text="This is the response of llm1")]]
        )
    )

    cb.on_tool_start(serialized={"name": "TestTool1"}, inputs={})
    cb.on_tool_end(output="This is the response of tool1")

    cb.on_chain_end(outputs={"res": "This is the response of TestChain1"})
