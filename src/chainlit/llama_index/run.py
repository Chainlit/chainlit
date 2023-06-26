from typing import Union
from llama_index.response.schema import Response, StreamingResponse
from llama_index.chat_engine.types import BaseChatEngine
from llama_index.indices.query.base import BaseQueryEngine

from chainlit.message import Message
from chainlit.sync import make_async


async def run_llama(instance: Union[BaseChatEngine, BaseQueryEngine], input_str: str):
    # Trick to display the loader in the UI until the first token is streamed
    await Message(content="").send()

    response_message = Message(content="")

    if isinstance(instance, BaseQueryEngine):
        response = await make_async(instance.query)(input_str)
    elif isinstance(instance, BaseChatEngine):
        response = await make_async(instance.chat)(input_str)
    else:
        raise NotImplementedError

    if isinstance(response, Response):
        response_message.content = str(response)
        await response_message.send()
    elif isinstance(response, StreamingResponse):
        gen = response.response_gen
        for token in gen:
            await response_message.stream_token(token=token)

        if response.response_txt:
            response_message.content = response.response_txt

        await response_message.send()
