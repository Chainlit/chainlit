from langchain.schema import Generation, LLMResult, SystemMessage

import chainlit as cl


@cl.on_chat_start
async def main():
    await cl.Message(content="AsyncLangchainCb").send()

    acb = cl.AsyncLangchainCallbackHandler()

    await acb.on_chain_start(serialized={"id": ["TestChain1"]}, inputs={})

    await acb.on_chat_model_start(
        serialized={}, messages=[[SystemMessage(content="This is prompt of llm1")]]
    )
    await acb.on_llm_end(
        response=LLMResult(
            generations=[[Generation(text="This is the response of llm1")]]
        )
    )

    await acb.on_tool_start(serialized={"name": "TestTool1"}, input_str="")
    await acb.on_tool_end(output="This is the response of tool1")

    await acb.on_chain_end(outputs={"res": "This is the response of TestChain1"})
