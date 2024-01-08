from typing import List, Union

from chainlit.input_widget import InputWidget
from chainlit.playground.provider import BaseProvider
from chainlit.sync import make_async
from fastapi.responses import StreamingResponse
from literalai import GenerationMessage


class LangchainGenericProvider(BaseProvider):
    from langchain.chat_models.base import BaseChatModel
    from langchain.llms.base import LLM
    from langchain.schema import BaseMessage

    llm: Union[LLM, BaseChatModel]

    def __init__(
        self,
        id: str,
        name: str,
        llm: Union[LLM, BaseChatModel],
        inputs: List[InputWidget] = [],
        is_chat: bool = False,
    ):
        super().__init__(
            id=id,
            name=name,
            env_vars={},
            inputs=inputs,
            is_chat=is_chat,
        )
        self.llm = llm

    def prompt_message_to_langchain_message(self, message: GenerationMessage):
        from langchain.schema.messages import (
            AIMessage,
            FunctionMessage,
            HumanMessage,
            SystemMessage,
        )

        content = "" if message.formatted is None else message.formatted
        if message.role == "user":
            return HumanMessage(content=content)
        elif message.role == "assistant":
            return AIMessage(content=content)
        elif message.role == "system":
            return SystemMessage(content=content)
        elif message.role == "tool":
            return FunctionMessage(
                content=content, name=message.name if message.name else "function"
            )
        else:
            raise ValueError(f"Got unknown type {message}")

    def format_message(self, message, prompt):
        message = super().format_message(message, prompt)
        return self.prompt_message_to_langchain_message(message)

    def message_to_string(self, message: BaseMessage) -> str:  # type: ignore[override]
        return str(message.content)

    async def create_completion(self, request):
        from langchain.schema.messages import BaseMessageChunk

        await super().create_completion(request)

        messages = self.create_generation(request)

        # https://github.com/langchain-ai/langchain/issues/14980
        result = await make_async(self.llm.stream)(
            input=messages, **request.generation.settings
        )

        def create_event_stream():
            try:
                for chunk in result:
                    if isinstance(chunk, BaseMessageChunk):
                        yield chunk.content
                    else:
                        yield chunk
            except Exception as e:
                # The better solution would be to return a 500 error, but
                # langchain raises the error in the stream, and the http
                # headers have already been sent.
                yield f"Failed to create completion: {str(e)}"

        return StreamingResponse(create_event_stream())
