from llama_index.callbacks.base import CallbackManager
from llama_index import (
    LLMPredictor,
    ServiceContext,
    StorageContext,
    load_index_from_storage,
)
import os
import openai
from langchain.llms import OpenAI
import chainlit as cl

openai.api_key = os.environ.get("OPENAI_API_KEY")


# rebuild storage context
storage_context = StorageContext.from_defaults(persist_dir="./storage")
# load index
index = load_index_from_storage(storage_context)


@cl.llama_index_factory
async def factory():
    llm_predictor = LLMPredictor(
        llm=OpenAI(temperature=0),
    )
    service_context = ServiceContext.from_defaults(
        llm_predictor=llm_predictor,
        chunk_size=512,
        callback_manager=CallbackManager([cl.LlamaIndexCallbackHandler()]),
    )

    query_engine = index.as_query_engine(service_context=service_context)

    return query_engine
