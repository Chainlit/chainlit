from typing import Any
from chainlit.lc.callbacks import ChainlitCallbackHandler, AsyncChainlitCallbackHandler
from asyncer import asyncify


async def run_langchain_agent(agent: Any, input_str: str, use_async: bool):
    if hasattr(agent, "input_keys"):
        input_key = agent.input_keys[0]
        if use_async:
            raw_res = await agent.acall(
                {input_key: input_str}, callbacks=[AsyncChainlitCallbackHandler()]
            )
        else:
            raw_res = await asyncify(agent.__call__, cancellable=True)(
                {input_key: input_str}, callbacks=[ChainlitCallbackHandler()]
            )
    else:
        if use_async:
            raw_res = await agent.acall(
                input_str, callbacks=[AsyncChainlitCallbackHandler()]
            )
        else:
            raw_res = await asyncify(agent.__call__, cancellable=True)(
                input_str, callbacks=[ChainlitCallbackHandler()]
            )

    if hasattr(agent, "output_keys"):
        output_key = agent.output_keys[0]
    else:
        output_key = None

    return raw_res, output_key
