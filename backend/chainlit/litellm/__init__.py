import asyncio
import time
from typing import Any, Dict, List, Optional

from literalai import ChatGeneration, GenerationMessage

from chainlit.context import get_context
from chainlit.step import Step
from chainlit.utils import timestamp_utc


def _build_generation(
    kwargs: Dict[str, Any],
    response_obj: Any,
    start_time: float,
    end_time: float,
) -> ChatGeneration:
    """Build a ChatGeneration from litellm call kwargs and response."""
    model = kwargs.get("model", "")
    messages = kwargs.get("messages", [])
    settings: Dict[str, Any] = {
        "model": model,
        "temperature": kwargs.get("temperature"),
        "max_tokens": kwargs.get("max_tokens"),
        "top_p": kwargs.get("top_p"),
        "stop": kwargs.get("stop"),
        "stream": kwargs.get("stream", False),
    }
    settings = {k: v for k, v in settings.items() if v is not None}

    gen_messages: List[GenerationMessage] = []
    for msg in messages:
        gen_messages.append(
            GenerationMessage(
                role=msg.get("role", "user"),
                content=msg.get("content", ""),
            )
        )

    message_completion: Optional[GenerationMessage] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None

    if response_obj and hasattr(response_obj, "choices") and response_obj.choices:
        choice = response_obj.choices[0]
        message = getattr(choice, "message", None)
        if message:
            message_completion = GenerationMessage(
                role=getattr(message, "role", "assistant"),
                content=getattr(message, "content", "") or "",
            )

    if response_obj and hasattr(response_obj, "usage") and response_obj.usage:
        usage = response_obj.usage
        input_tokens = getattr(usage, "prompt_tokens", None)
        output_tokens = getattr(usage, "completion_tokens", None)

    duration = end_time - start_time

    provider = model.split("/")[0] if "/" in model else "litellm"

    return ChatGeneration(
        provider=provider,
        model=model,
        settings=settings,
        messages=gen_messages,
        message_completion=message_completion,
        input_token_count=input_tokens,
        output_token_count=output_tokens,
        duration=duration,
    )


def instrument_litellm() -> None:
    """Instrument LiteLLM to automatically log completions as Chainlit Steps.

    Uses litellm's native CustomLogger callback API. Each litellm.completion()
    call will appear as an LLM step in the Chainlit UI with model name,
    messages, response, token usage, and timing.

    Example:
        import chainlit as cl
        cl.instrument_litellm()

        # All subsequent litellm.completion() calls will be traced
        import litellm
        response = litellm.completion(
            model="anthropic/claude-sonnet-4-20250514",
            messages=[{"role": "user", "content": "Hello!"}],
        )
    """
    try:
        import importlib.util

        if importlib.util.find_spec("litellm") is None:
            raise ImportError
    except ImportError:
        raise ValueError("litellm is not installed. Run `pip install litellm`")

    import litellm
    from litellm.integrations.custom_logger import CustomLogger

    class ChainlitLogger(CustomLogger):
        def log_success_event(
            self,
            kwargs: Dict[str, Any],
            response_obj: Any,
            start_time: float,
            end_time: float,
        ) -> None:
            try:
                start_ts = (
                    start_time if isinstance(start_time, (int, float)) else time.time()
                )
                end_ts = end_time if isinstance(end_time, (int, float)) else time.time()

                generation = _build_generation(kwargs, response_obj, start_ts, end_ts)
                context = get_context()

                parent_id = None
                if context.current_step:
                    parent_id = context.current_step.id

                step = Step(
                    name=generation.model or "litellm",
                    type="llm",
                    parent_id=parent_id,
                )
                step.generation = generation
                step.start = timestamp_utc(start_ts)
                step.end = timestamp_utc(end_ts)

                if generation.messages:
                    step.input = generation.messages  # type: ignore
                if generation.message_completion:
                    step.output = generation.message_completion  # type: ignore

                asyncio.create_task(step.send())
            except Exception:
                pass

        async def async_log_success_event(
            self,
            kwargs: Dict[str, Any],
            response_obj: Any,
            start_time: float,
            end_time: float,
        ) -> None:
            self.log_success_event(kwargs, response_obj, start_time, end_time)

    for cb in litellm.callbacks:
        if type(cb).__name__ == "ChainlitLogger":
            return

    litellm.callbacks.append(ChainlitLogger())
