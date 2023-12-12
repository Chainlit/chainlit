import os

from chainlit.input_widget import Select, Slider
from chainlit.playground.config import BaseProvider, add_llm_provider
from chainlit.playground.providers.langchain import LangchainGenericProvider
from fastapi.responses import StreamingResponse
from langchain.llms.fake import FakeListLLM

import chainlit as cl

os.environ["TEST_LLM_API_KEY"] = "sk..."


class TestLLMProvider(BaseProvider):
    async def create_completion(self, request):
        await super().create_completion(request)

        self.create_generation(request)
        self.require_settings(request.generation.settings)

        stream = ["This ", "is ", "the ", "test ", "completion"]

        async def create_event_stream():
            for token in stream:
                await cl.sleep(0.1)
                yield token

        return StreamingResponse(create_event_stream())


TestLLM = TestLLMProvider(
    id="test",
    name="Test",
    env_vars={"api_key": "TEST_LLM_API_KEY"},
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["test-model-1", "test-model-2"],
            initial_value="test-model-2",
        ),
        Slider(
            id="temperature",
            label="Temperature",
            min=0.0,
            max=1.0,
            step=0.01,
            initial=1,
        ),
    ],
    is_chat=False,
)

ChatTestLLM = TestLLMProvider(
    id="test-chat",
    name="TestChat",
    env_vars={"api_key": "TEST_LLM_API_KEY"},
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["test-model-chat-1", "test-model-chat-2"],
            initial_value="test-model-chat-2",
        ),
        Slider(
            id="temperature",
            label="Temperature",
            min=0.0,
            max=1.0,
            step=0.01,
            initial=1,
        ),
    ],
    is_chat=True,
)

llm = FakeListLLM(responses=["This is the test completion"])

LangchainTestLLM = LangchainGenericProvider(
    id="test-langchain",
    name="TestLangchain",
    llm=llm,
    is_chat=False,
)


add_llm_provider(TestLLM)
add_llm_provider(ChatTestLLM)
add_llm_provider(LangchainTestLLM)
