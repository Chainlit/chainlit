import asyncio
from typing import Union

from literalai import ChatGeneration, CompletionGeneration
from literalai.helper import timestamp_utc

from chainlit.context import local_steps
from chainlit.step import Step
from chainlit.utils import check_module_version


def instrument_openai():
    if not check_module_version("openai", "1.0.0"):
        raise ValueError(
            "Expected OpenAI version >= 1.0.0. Run `pip install openai --upgrade`"
        )

    from literalai.instrumentation.openai import instrument_openai

    def on_new_generation(
        generation: Union["ChatGeneration", "CompletionGeneration"], timing
    ):
        previous_steps = local_steps.get()

        parent_id = previous_steps[-1].id if previous_steps else None

        step = Step(
            name=generation.model if generation.model else generation.provider,
            type="llm",
            parent_id=parent_id,
        )
        step.generation = generation
        # Convert start/end time from seconds to milliseconds
        step.start = (
            timestamp_utc(timing.get("start"))
            if timing.get("start", None) is not None
            else None
        )
        step.end = (
            timestamp_utc(timing.get("end"))
            if timing.get("end", None) is not None
            else None
        )

        if isinstance(generation, ChatGeneration):
            step.input = generation.messages
            step.output = generation.message_completion  # type: ignore
        else:
            step.input = generation.prompt
            step.output = generation.completion

        asyncio.create_task(step.send())

    instrument_openai(None, on_new_generation)
