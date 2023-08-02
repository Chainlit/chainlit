from llama_index.callbacks.schema import CBEventType, EventPayload
from llama_index.schema import NodeWithScore, TextNode

import chainlit as cl


@cl.on_chat_start
async def start():
    await cl.Message(content="LlamaIndexCb").send()

    cb = cl.LlamaIndexCallbackHandler()

    cb.start_trace()

    cb.on_event_start(CBEventType.RETRIEVE, payload={})

    cb.on_event_end(
        CBEventType.RETRIEVE,
        payload={
            EventPayload.NODES: [
                NodeWithScore(node=TextNode(text="This is text1"), score=1)
            ]
        },
    )

    cb.on_event_start(CBEventType.LLM)

    cb.on_event_end(
        CBEventType.LLM,
        payload={
            EventPayload.RESPONSE: "This is the LLM response",
            EventPayload.PROMPT: "This is the LLM prompt",
        },
    )
