from chainlit.input_widget import Select, Slider, Tags
from chainlit.playground.provider import BaseProvider
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from literalai import GenerationMessage


class AnthropicProvider(BaseProvider):
    def message_to_string(self, message: GenerationMessage) -> str:
        import anthropic

        if message.role == "user":
            message_text = f"{anthropic.HUMAN_PROMPT} {message.formatted}"
        elif message.role == "assistant":
            message_text = f"{anthropic.AI_PROMPT} {message.formatted}"
        elif message.role == "function":
            message_text = f"{anthropic.AI_PROMPT} {message.formatted}"
        elif message.role == "system":
            message_text = (
                f"{anthropic.HUMAN_PROMPT} <admin>{message.formatted}</admin>"
            )
        else:
            raise HTTPException(status_code=400, detail=f"Got unknown type {message}")
        return message_text

    async def create_completion(self, request):
        await super().create_completion(request)
        import anthropic

        env_settings = self.validate_env(request=request)

        llm_settings = request.generation.settings
        self.require_settings(llm_settings)

        prompt = self.concatenate_messages(self.create_generation(request), joiner="")

        if not prompt.endswith(anthropic.AI_PROMPT):
            prompt += anthropic.AI_PROMPT

        client = anthropic.AsyncAnthropic(**env_settings)

        llm_settings["stream"] = True

        try:
            stream = await client.completions.create(prompt=prompt, **llm_settings)
        except anthropic.APIConnectionError as e:
            raise HTTPException(
                status_code=503,
                detail=e.__cause__,
            )
        except anthropic.RateLimitError as e:
            raise HTTPException(
                status_code=429,
            )
        except anthropic.APIStatusError as e:
            raise HTTPException(status_code=e.status_code, detail=e.response)

        async def create_event_stream():
            async for data in stream:
                token = data.completion
                yield token

        return StreamingResponse(create_event_stream())


Anthropic = AnthropicProvider(
    id="anthropic-chat",
    name="Anthropic",
    env_vars={"api_key": "ANTHROPIC_API_KEY"},
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["claude-2", "claude-instant-1"],
            initial_value="claude-2",
        ),
        Slider(
            id="max_tokens_to_sample",
            label="Max Tokens To Sample",
            min=1.0,
            max=100000,
            step=1.0,
            initial=1000,
        ),
        Tags(
            id="stop_sequences",
            label="Stop Sequences",
            initial=[],
        ),
        Slider(
            id="temperature",
            label="Temperature",
            min=0.0,
            max=1.0,
            step=0.01,
            initial=1,
        ),
        Slider(
            id="top_p",
            label="Top P",
            min=0.0,
            max=1.0,
            step=0.01,
            initial=0.7,
        ),
        Slider(
            id="top_k",
            label="Top K",
            min=0.0,
            max=2048.0,
            step=1.0,
            initial=0,
        ),
    ],
    is_chat=True,
)
