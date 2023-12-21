import json
from contextlib import contextmanager

from chainlit.input_widget import Select, Slider, Tags
from chainlit.playground.provider import BaseProvider
from fastapi import HTTPException
from fastapi.responses import StreamingResponse


def stringify_function_call(function_call):
    if isinstance(function_call, dict):
        _function_call = function_call.copy()
    else:
        _function_call = {
            "arguments": function_call.arguments,
            "name": function_call.name,
        }

    if "arguments" in _function_call and isinstance(_function_call["arguments"], str):
        _function_call["arguments"] = json.loads(_function_call["arguments"])
    return json.dumps(_function_call, indent=4, ensure_ascii=False)


openai_common_inputs = [
    Slider(
        id="temperature",
        label="Temperature",
        min=0.0,
        max=2.0,
        step=0.01,
        initial=0.9,
        tooltip="Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.",
    ),
    Slider(
        id="max_tokens",
        label="Max Tokens",
        min=0.0,
        max=8000,
        step=1,
        initial=256,
        tooltip="The maximum number of tokens to generate in the chat completion.",
    ),
    Slider(
        id="top_p",
        label="Top P",
        min=0.0,
        max=1.0,
        step=0.01,
        initial=1.0,
        tooltip="An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.",
    ),
    Slider(
        id="frequency_penalty",
        label="Frequency Penalty",
        min=-2.0,
        max=2.0,
        step=0.01,
        initial=0.0,
        tooltip="Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
    ),
    Slider(
        id="presence_penalty",
        label="Presence Penalty",
        min=-2.0,
        max=2.0,
        step=0.01,
        initial=0.0,
        tooltip="Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.",
    ),
    Tags(
        id="stop",
        label="Stop Sequences",
        initial=[],
        tooltip="Up to 4 sequences where the API will stop generating further tokens.",
    ),
]


@contextmanager
def handle_openai_error():
    import openai

    try:
        yield
    except openai.APITimeoutError as e:
        raise HTTPException(
            status_code=408,
            detail=f"OpenAI API request timed out: {e}",
        )
    except openai.APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API returned an API Error: {e}",
        )
    except openai.APIConnectionError as e:
        raise HTTPException(
            status_code=503,
            detail=f"OpenAI API request failed to connect: {e}",
        )
    except openai.AuthenticationError as e:
        raise HTTPException(
            status_code=403,
            detail=f"OpenAI API request was not authorized: {e}",
        )
    except openai.PermissionDeniedError as e:
        raise HTTPException(
            status_code=403,
            detail=f"OpenAI API request was not permitted: {e}",
        )
    except openai.RateLimitError as e:
        raise HTTPException(
            status_code=429,
            detail=f"OpenAI API request exceeded rate limit: {e}",
        )


class ChatOpenAIProvider(BaseProvider):
    def format_message(self, message, prompt):
        message = super().format_message(message, prompt)
        return message.to_openai()

    async def create_completion(self, request):
        await super().create_completion(request)
        from openai import AsyncClient

        env_settings = self.validate_env(request=request)

        client = AsyncClient(api_key=env_settings["api_key"])

        llm_settings = request.generation.settings

        self.require_settings(llm_settings)

        messages = self.create_generation(request)

        if "stop" in llm_settings:
            stop = llm_settings["stop"]

            # OpenAI doesn't support an empty stop array, clear it
            if isinstance(stop, list) and len(stop) == 0:
                stop = None

            llm_settings["stop"] = stop

        if request.generation.functions:
            llm_settings["functions"] = request.generation.functions
            llm_settings["stream"] = False
        else:
            llm_settings["stream"] = True

        with handle_openai_error():
            response = await client.chat.completions.create(
                messages=messages,
                **llm_settings,
            )

        if llm_settings["stream"]:

            async def create_event_stream():
                async for part in response:
                    if part.choices and part.choices[0].delta.content:
                        token = part.choices[0].delta.content
                        yield token
                    else:
                        continue

        else:

            async def create_event_stream():
                message = response.choices[0].message
                if function_call := message.function_call:
                    yield stringify_function_call(function_call)
                else:
                    yield message.content or ""

        return StreamingResponse(create_event_stream())


class OpenAIProvider(BaseProvider):
    def message_to_string(self, message):
        return message.to_string()

    async def create_completion(self, request):
        await super().create_completion(request)
        from openai import AsyncClient

        env_settings = self.validate_env(request=request)

        client = AsyncClient(api_key=env_settings["api_key"])

        llm_settings = request.generation.settings

        self.require_settings(llm_settings)

        prompt = self.create_generation(request)

        if "stop" in llm_settings:
            stop = llm_settings["stop"]

            # OpenAI doesn't support an empty stop array, clear it
            if isinstance(stop, list) and len(stop) == 0:
                stop = None

            llm_settings["stop"] = stop

        llm_settings["stream"] = True

        with handle_openai_error():
            response = await client.completions.create(
                prompt=prompt,
                **llm_settings,
            )

        async def create_event_stream():
            async for part in response:
                if part.choices and part.choices[0].text:
                    token = part.choices[0].text
                    yield token
                else:
                    continue

        return StreamingResponse(create_event_stream())


class AzureOpenAIProvider(BaseProvider):
    def message_to_string(self, message):
        return message.to_string()

    async def create_completion(self, request):
        await super().create_completion(request)
        from openai import AsyncAzureOpenAI

        env_settings = self.validate_env(request=request)

        client = AsyncAzureOpenAI(
            api_key=env_settings["api_key"],
            api_version=env_settings["api_version"],
            azure_endpoint=env_settings["azure_endpoint"],
            azure_ad_token=self.get_var(request, "AZURE_AD_TOKEN"),
            azure_deployment=self.get_var(request, "AZURE_DEPLOYMENT"),
        )
        llm_settings = request.generation.settings

        self.require_settings(llm_settings)

        prompt = self.create_generation(request)

        if "stop" in llm_settings:
            stop = llm_settings["stop"]

            # OpenAI doesn't support an empty stop array, clear it
            if isinstance(stop, list) and len(stop) == 0:
                stop = None

            llm_settings["stop"] = stop

        llm_settings["stream"] = True

        with handle_openai_error():
            response = await client.completions.create(
                prompt=prompt,
                **llm_settings,
            )

        async def create_event_stream():
            async for part in response:
                if part.choices and part.choices[0].text:
                    token = part.choices[0].text
                    yield token
                else:
                    continue

        return StreamingResponse(create_event_stream())


class AzureChatOpenAIProvider(BaseProvider):
    def format_message(self, message, prompt):
        message = super().format_message(message, prompt)
        return message.to_openai()

    async def create_completion(self, request):
        await super().create_completion(request)
        from openai import AsyncAzureOpenAI

        env_settings = self.validate_env(request=request)

        client = AsyncAzureOpenAI(
            api_key=env_settings["api_key"],
            api_version=env_settings["api_version"],
            azure_endpoint=env_settings["azure_endpoint"],
            azure_ad_token=self.get_var(request, "AZURE_AD_TOKEN"),
            azure_deployment=self.get_var(request, "AZURE_DEPLOYMENT"),
        )

        llm_settings = request.generation.settings

        self.require_settings(llm_settings)

        messages = self.create_generation(request)

        if "stop" in llm_settings:
            stop = llm_settings["stop"]

            # OpenAI doesn't support an empty stop array, clear it
            if isinstance(stop, list) and len(stop) == 0:
                stop = None

            llm_settings["stop"] = stop

        llm_settings["model"] = env_settings["deployment_name"]

        if request.generation.functions:
            llm_settings["functions"] = request.generation.functions
            llm_settings["stream"] = False
        else:
            llm_settings["stream"] = True

        with handle_openai_error():
            response = await client.chat.completions.create(
                messages=messages,
                **llm_settings,
            )

        if llm_settings["stream"]:

            async def create_event_stream():
                async for part in response:
                    if part.choices and part.choices[0].delta.content:
                        token = part.choices[0].delta.content
                        yield token
                    else:
                        continue

        else:

            async def create_event_stream():
                message = response.choices[0].message
                if function_call := message.function_call:
                    yield stringify_function_call(function_call)
                else:
                    yield message.content or ""

        return StreamingResponse(create_event_stream())


openai_env_vars = {"api_key": "OPENAI_API_KEY"}

azure_openai_env_vars = {
    "api_key": "AZURE_OPENAI_API_KEY",
    "api_version": "AZURE_OPENAI_API_VERSION",
    "azure_endpoint": "AZURE_OPENAI_ENDPOINT",
    "deployment_name": "AZURE_OPENAI_DEPLOYMENT_NAME",
}

ChatOpenAI = ChatOpenAIProvider(
    id="openai-chat",
    env_vars=openai_env_vars,
    name="ChatOpenAI",
    inputs=[
        Select(
            id="model",
            label="Model",
            values=[
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-16k",
                "gpt-4",
                "gpt-4-32k",
                "gpt-4-1106-preview",
            ],
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


AzureChatOpenAI = AzureChatOpenAIProvider(
    id="azure-openai-chat",
    env_vars=azure_openai_env_vars,
    name="AzureChatOpenAI",
    inputs=openai_common_inputs,
    is_chat=True,
)

AzureOpenAI = AzureOpenAIProvider(
    id="azure",
    name="AzureOpenAI",
    env_vars=azure_openai_env_vars,
    inputs=openai_common_inputs,
    is_chat=False,
)
