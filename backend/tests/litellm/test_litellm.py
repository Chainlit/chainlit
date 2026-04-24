import time
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from chainlit.litellm import _build_generation, instrument_litellm
from chainlit.step import Step


def _make_response(content="test response", model="anthropic/claude-sonnet-4-6"):
    message = SimpleNamespace(content=content, role="assistant")
    choice = SimpleNamespace(message=message, finish_reason="stop", index=0)
    usage = SimpleNamespace(prompt_tokens=10, completion_tokens=5, total_tokens=15)
    return SimpleNamespace(choices=[choice], usage=usage, model=model, id="mock")


def _make_kwargs(model="anthropic/claude-sonnet-4-6", messages=None):
    return {
        "model": model,
        "messages": messages or [{"role": "user", "content": "Hello"}],
        "temperature": 0.7,
        "max_tokens": 100,
        "stream": False,
    }


class TestBuildGeneration:
    def test_basic_generation(self):
        kwargs = _make_kwargs()
        response = _make_response()
        gen = _build_generation(kwargs, response, 1000.0, 1002.0)

        assert gen.model == "anthropic/claude-sonnet-4-6"
        assert gen.provider == "anthropic"
        assert gen.settings["model"] == "anthropic/claude-sonnet-4-6"
        assert gen.settings["temperature"] == 0.7
        assert gen.settings["max_tokens"] == 100
        assert gen.duration == pytest.approx(2.0)

    def test_messages_converted(self):
        messages = [
            {"role": "system", "content": "You are helpful."},
            {"role": "user", "content": "Hi"},
        ]
        kwargs = _make_kwargs(messages=messages)
        response = _make_response()
        gen = _build_generation(kwargs, response, 0, 1)

        assert len(gen.messages) == 2
        assert gen.messages[0]["role"] == "system"
        assert gen.messages[0]["content"] == "You are helpful."
        assert gen.messages[1]["role"] == "user"
        assert gen.messages[1]["content"] == "Hi"

    def test_completion_extracted(self):
        kwargs = _make_kwargs()
        response = _make_response(content="The answer is 4.")
        gen = _build_generation(kwargs, response, 0, 1)

        assert gen.message_completion is not None
        assert gen.message_completion["role"] == "assistant"
        assert gen.message_completion["content"] == "The answer is 4."

    def test_token_counts(self):
        kwargs = _make_kwargs()
        response = _make_response()
        gen = _build_generation(kwargs, response, 0, 1)

        assert gen.input_token_count == 10
        assert gen.output_token_count == 5

    def test_provider_extraction(self):
        kwargs = _make_kwargs(model="openai/gpt-4o")
        response = _make_response(model="openai/gpt-4o")
        gen = _build_generation(kwargs, response, 0, 1)
        assert gen.provider == "openai"

    def test_provider_without_slash(self):
        kwargs = _make_kwargs(model="gpt-4o")
        response = _make_response(model="gpt-4o")
        gen = _build_generation(kwargs, response, 0, 1)
        assert gen.provider == "litellm"

    def test_none_response(self):
        kwargs = _make_kwargs()
        gen = _build_generation(kwargs, None, 0, 1)
        assert gen.message_completion is None
        assert gen.input_token_count is None

    def test_empty_choices(self):
        response = SimpleNamespace(choices=[], usage=None, model="test", id="x")
        kwargs = _make_kwargs()
        gen = _build_generation(kwargs, response, 0, 1)
        assert gen.message_completion is None

    def test_settings_strip_none(self):
        kwargs = {"model": "test", "messages": [], "stream": False}
        response = _make_response()
        gen = _build_generation(kwargs, response, 0, 1)
        assert "temperature" not in gen.settings
        assert "top_p" not in gen.settings


class TestInstrumentLiteLLM:
    def test_registers_callback(self):
        import litellm

        original_count = len(litellm.callbacks)
        instrument_litellm()
        assert len(litellm.callbacks) >= original_count + 1

    def test_idempotent(self):
        instrument_litellm()
        import litellm

        count_after = len(litellm.callbacks)
        instrument_litellm()
        assert len(litellm.callbacks) == count_after

    def test_callback_creates_step(self, mock_chainlit_context):
        import litellm

        instrument_litellm()
        logger = [
            cb for cb in litellm.callbacks if type(cb).__name__ == "ChainlitLogger"
        ][-1]

        kwargs = _make_kwargs()
        response = _make_response()

        async def run():
            async with mock_chainlit_context:
                with patch.object(Step, "send", new_callable=AsyncMock):
                    logger.log_success_event(kwargs, response, time.time(), time.time())

        import asyncio

        asyncio.get_event_loop().run_until_complete(run())

    def test_callback_handles_no_context(self):
        import litellm

        instrument_litellm()
        logger = [
            cb for cb in litellm.callbacks if type(cb).__name__ == "ChainlitLogger"
        ][-1]

        kwargs = _make_kwargs()
        response = _make_response()

        logger.log_success_event(kwargs, response, time.time(), time.time())
