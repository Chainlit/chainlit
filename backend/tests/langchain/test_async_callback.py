"""Tests for async LangChain callback handlers."""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest
from langchain_core.outputs import GenerationChunk

from chainlit.langchain.callbacks import LangchainTracer
from chainlit.step import Step


def create_mock_run(**kwargs):
    """Helper to create a properly mocked Run object with all required attributes."""
    run = Mock()
    run.id = kwargs.get("id", uuid4())
    run.parent_run_id = kwargs.get("parent_run_id", None)
    run.name = kwargs.get("name", "test_run")
    run.run_type = kwargs.get("run_type", "llm")
    run.tags = kwargs.get("tags", [])
    run.inputs = kwargs.get("inputs", {})
    run.outputs = kwargs.get("outputs", None)
    run.serialized = kwargs.get("serialized", {})
    run.extra = kwargs.get("extra", {})
    run.start_time = kwargs.get("start_time", datetime.now())
    run.end_time = kwargs.get("end_time", None)
    run.error = kwargs.get("error", None)
    return run


@pytest.fixture
def mock_run():
    """Create a mock LangChain Run object."""
    return create_mock_run(
        name="test_run",
        run_type="llm",
        inputs={"input": "test input"},
        serialized={"name": "test_llm"},
    )


async def test_tracer_initialization(mock_chainlit_context):
    """Test LangchainTracer initialization."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()

        assert tracer.steps == {}
        assert tracer.parent_id_map == {}
        assert tracer.ignored_runs == set()
        assert tracer.stream_final_answer is False
        assert tracer.answer_reached is False


async def test_on_llm_start(mock_chainlit_context):
    """Test on_llm_start callback."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()
        run_id = uuid4()
        prompts = ["Test prompt"]

        await tracer.on_llm_start(
            serialized={"name": "test_llm"},
            prompts=prompts,
            run_id=run_id,
        )

        assert str(run_id) in tracer.completion_generations
        completion_gen = tracer.completion_generations[str(run_id)]
        assert completion_gen["prompt"] == "Test prompt"
        assert completion_gen["token_count"] == 0
        assert completion_gen["tt_first_token"] is None
        assert "start" in completion_gen


async def test_on_llm_new_token(mock_chainlit_context):
    """Test on_llm_new_token with token streaming."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()
        run_id = uuid4()

        await tracer.on_llm_start(
            serialized={"name": "test_llm"},
            prompts=["Test prompt"],
            run_id=run_id,
        )

        chunk = GenerationChunk(text="Hello")
        await tracer.on_llm_new_token(
            token="Hello",
            chunk=chunk,
            run_id=run_id,
        )

        completion_gen = tracer.completion_generations[str(run_id)]
        assert completion_gen["token_count"] == 1
        assert completion_gen["tt_first_token"] is not None


async def test_start_trace(mock_chainlit_context):
    """Test _start_trace creates steps correctly."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()

        # Test LLM run
        llm_run = create_mock_run(
            id=uuid4(),
            name="test_llm",
            run_type="llm",
            inputs={"input": "test"},
        )

        with patch.object(Step, "send", new_callable=AsyncMock):
            await tracer._start_trace(llm_run)

        assert str(llm_run.id) in tracer.steps
        assert tracer.steps[str(llm_run.id)].type == "llm"

        # Test ignored run
        ignored_run = create_mock_run(
            id=uuid4(),
            name="RunnableSequence",
            run_type="chain",
        )
        tracer.to_ignore = ["RunnableSequence"]
        await tracer._start_trace(ignored_run)

        assert str(ignored_run.id) in tracer.ignored_runs


async def test_on_run_update(mock_chainlit_context):
    """Test _on_run_update updates steps."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()
        run_id = uuid4()

        step = Step(id=str(run_id), name="test_tool", type="tool")
        tracer.steps[str(run_id)] = step

        run = create_mock_run(
            id=run_id,
            name="test_tool",
            run_type="tool",
            outputs={"output": "result"},
        )

        with patch.object(step, "update", new_callable=AsyncMock):
            await tracer._on_run_update(run)

        assert step.output is not None


async def test_error_handling(mock_chainlit_context):
    """Test error handling in callbacks."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()
        run_id = uuid4()

        step = Step(id=str(run_id), name="test_step", type="llm")
        tracer.steps[str(run_id)] = step

        error = ValueError("Test error")

        with patch.object(step, "update", new_callable=AsyncMock):
            await tracer._on_error(error, run_id=run_id)

        assert step.is_error is True
        assert step.output == "Test error"
