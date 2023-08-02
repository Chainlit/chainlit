import os

from fastapi.responses import PlainTextResponse

from chainlit.input_widget import Select, Slider, Tags
from chainlit.playground.provider import BaseProvider
from chainlit.types import PromptMessage


class AnthropicProvider(BaseProvider):
    def _convert_one_message_to_text(self, message: PromptMessage) -> str:
        import anthropic

        if message.role == "human":
            message_text = f"{anthropic.HUMAN_PROMPT} {message.formatted}"
        elif message.role == "ai":
            message_text = f"{anthropic.AI_PROMPT} {message.formatted}"
        elif message.role == "system":
            message_text = (
                f"{anthropic.HUMAN_PROMPT} <admin>{message.formatted}</admin>"
            )
        else:
            raise ValueError(f"Got unknown type {message}")
        return message_text

    async def create_completion(self, request):
        await super().create_completion(request)
        import anthropic

        api_key = request.userEnv.get(
            "ANTHROPIC_API_KEY", os.environ.get("ANTHROPIC_API_KEY")
        )

        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found")

        self.require_settings(request.settings)
        self.require_prompt(request)

        messages = [self._convert_one_message_to_text(m) for m in request.messages]
        prompt = "".join(messages)

        client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

        response = await client.completions.create(prompt=prompt, **request.settings)

        return PlainTextResponse(content=response.completion)


Anthropic = AnthropicProvider(
    id="anthropic-chat",
    name="Anthropic",
    env_var=["ANTHROPIC_API_KEY"],
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
            max=2048.0,
            step=1.0,
            initial=1,
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
