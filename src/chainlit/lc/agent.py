from typing import Any
from chainlit.lc.callbacks import (
    LangchainCallbackHandler,
    AsyncLangchainCallbackHandler,
)
from chainlit.sync import make_async
from chainlit.context import emitter_var


async def run_langchain_agent(agent: Any, input_str: str, use_async: bool):
    if hasattr(agent, "input_keys"):
        input_key = agent.input_keys[0]
        inputs = {input_key: input_str}
    else:
        inputs = input_str

    if use_async:
        callback_handler = AsyncLangchainCallbackHandler(stream_final_answer=True)
        raw_res = await agent.acall(inputs, callbacks=[callback_handler])
    else:
        callback_handler = LangchainCallbackHandler(stream_final_answer=True)
        raw_res = await make_async(agent.__call__)(inputs, callbacks=[callback_handler])

    if hasattr(agent, "output_keys"):
        output_key = agent.output_keys[0]
    else:
        output_key = None

    return (
        raw_res,
        output_key,
        callback_handler.has_streamed_final_answer,
    )
