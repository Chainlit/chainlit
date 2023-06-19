from typing import Any
from llama_index.response.schema import Response, StreamingResponse
from llama_index.chat_engine import CondenseQuestionChatEngine, ReActChatEngine
from llama_index.query_engine.retriever_query_engine import RetrieverQueryEngine

from chainlit.message import Message


async def run_llama(instance: Any, input_str: str):
    # Trick to display the loader in the UI until the first token is streamed
    await Message(content="").send()

    response_message = Message(content="")

    if isinstance(instance, RetrieverQueryEngine):
        response = await instance.aquery(input_str)
    elif isinstance(instance, CondenseQuestionChatEngine):
        response = await instance.achat(input_str)
    elif isinstance(instance, ReActChatEngine):
        response = await instance.achat(input_str)
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
