import os

from fastapi.responses import PlainTextResponse

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

        api_key = request.userEnv.get(
            "OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY")
        )

        if not api_key:
            raise ValueError("OPENAI_API_KEY not found")

        self.require_settings(request.settings)
        self.require_prompt(request)

        messages = [{"role": m.role, "content": m.formatted} for m in request.messages]

        stop = request.settings["stop"]

        # OpenAI doesn't support an empty stop array, clear it
        if isinstance(stop, list) and len(stop) == 0:
            stop = None

        request.settings["stop"] = stop

        response = await openai.ChatCompletion.acreate(
            api_key=api_key,
            messages=messages,
            **request.settings,
        )

        return PlainTextResponse(content=response["choices"][0]["message"]["content"])


class OpenAIProvider(BaseProvider):
    async def create_completion(self, request):
        await super().create_completion(request)
        import openai

        api_key = request.userEnv.get(
            "OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY")
        )

        if not api_key:
            raise ValueError("OPENAI_API_KEY not found")

        self.require_settings(request.settings)
        self.require_prompt(request)

        stop = request.settings["stop"]

        # OpenAI doesn't support an empty stop array, clear it
        if isinstance(stop, list) and len(stop) == 0:
            stop = None

        request.settings["stop"] = stop

        response = await openai.Completion.acreate(
            api_key=api_key,
            prompt=request.prompt,
            **request.settings,
        )

        return PlainTextResponse(content=response["choices"][0]["text"])


ChatOpenAI = ChatOpenAIProvider(
    id="openai-chat",
    name="ChatOpenAI",
    env_var=["OPENAI_API_KEY"],
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
    env_var=["OPENAI_API_KEY"],
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
