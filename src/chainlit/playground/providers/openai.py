import os

from fastapi.responses import StreamingResponse

from chainlit.input_widget import Select, Slider, Tags
from chainlit.playground.provider import BaseProvider

openai_common_inputs = [
    Slider(
        id="temperature",
        label="Temperature",
        min=0.0,
        max=1.0,
        step=0.01,
        initial=0.9,
    ),
    Slider(id="top_p", label="Top P", min=0.0, max=1.0, step=0.01, initial=1.0),
    Slider(
        id="frequency_penalty",
        label="Frequency Penalty",
        min=0.0,
        max=1.0,
        step=0.01,
        initial=0.0,
    ),
    Slider(
        id="presence_penalty",
        label="Presence Penalty",
        min=0.0,
        max=1.0,
        step=0.01,
        initial=0.0,
    ),
    Tags(id="stop", label="Stop Sequences", initial=[]),
]


class ChatOpenAIProvider(BaseProvider):
    async def create_completion(self, request):
        await super().create_completion(request)
        import openai

        env_settings = self.validate_env(request=request)

        self.require_settings(request.settings)
        self.require_prompt(request)

        messages = [{"role": m.role, "content": m.formatted} for m in request.messages]

        stop = request.settings["stop"]

        # OpenAI doesn't support an empty stop array, clear it
        if isinstance(stop, list) and len(stop) == 0:
            stop = None

        request.settings["stop"] = stop

        request.settings["stream"] = True

        async def create_event_stream():
            response = await openai.ChatCompletion.acreate(
                **env_settings,
                messages=messages,
                **request.settings,
            )
            async for stream_resp in response:
                token = stream_resp.choices[0]["delta"].get("content", "")
                yield token

        return StreamingResponse(create_event_stream())


class OpenAIProvider(BaseProvider):
    async def create_completion(self, request):
        await super().create_completion(request)
        import openai

        env_settings = self.validate_env(request=request)

        self.require_settings(request.settings)
        self.require_prompt(request)

        stop = request.settings["stop"]

        # OpenAI doesn't support an empty stop array, clear it
        if isinstance(stop, list) and len(stop) == 0:
            stop = None

        request.settings["stop"] = stop

        request.settings["stream"] = True

        async def create_event_stream():
            response = await openai.Completion.acreate(
                **env_settings,
                prompt=request.prompt,
                **request.settings,
            )
            async for stream_resp in response:
                token = stream_resp.get("choices")[0].get("text")
                yield token

        return StreamingResponse(create_event_stream())


openai_env_vars = {"api_key": "OPENAI_API_KEY"}

azure_openai_env_vars = {
    "api_key": "OPENAI_API_KEY",
    "api_type": "OPENAI_API_TYPE",
    "api_base": "OPENAI_API_BASE",
    "api_version": "OPENAI_API_VERSION",
    "deployment_id": "OPENAI_API_DEPLOYMENT_ID",
}

ChatOpenAI = ChatOpenAIProvider(
    id="openai-chat",
    env_vars=openai_env_vars,
    name="ChatOpenAI",
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt4"],
            initial_value="gpt-3.5-turbo",
        ),
        *openai_common_inputs,
    ],
    is_chat=True,
)


AzureChatOpenAI = ChatOpenAIProvider(
    id="azure-openai-chat",
    env_vars=azure_openai_env_vars,
    name="AzureChatOpenAI",
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt4"],
            initial_value="gpt-3.5-turbo",
        ),
        *openai_common_inputs,
    ],
    is_chat=True,
)

OpenAI = OpenAIProvider(
    id="openai",
    name="OpenAI",
    env_vars=openai_env_vars,
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["text-davinci-003", "text-davinci-002"],
            initial_value="text-davinci-003",
        ),
        *openai_common_inputs,
    ],
    is_chat=False,
)

AzureOpenAI = OpenAIProvider(
    id="azure",
    name="AzureOpenAI",
    env_vars=azure_openai_env_vars,
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["text-davinci-003", "text-davinci-002"],
            initial_value="text-davinci-003",
        ),
        *openai_common_inputs,
    ],
    is_chat=False,
)
