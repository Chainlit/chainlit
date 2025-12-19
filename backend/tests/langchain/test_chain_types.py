"""Tests for different LangChain chain types and their integration with Chainlit."""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

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


async def test_different_run_types(mock_chainlit_context):
    """Test different LangChain run types create correct steps."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()

        # Test agent run
        agent_run = create_mock_run(
            id=uuid4(),
            name="test_agent",
            run_type="agent",
            inputs={"input": "test"},
        )

        with patch.object(Step, "send", new_callable=AsyncMock):
            await tracer._start_trace(agent_run)

        assert str(agent_run.id) in tracer.steps
        assert tracer.steps[str(agent_run.id)].type == "run"

        # Test tool run
        tool_run = create_mock_run(
            id=uuid4(),
            name="test_tool",
            run_type="tool",
            inputs={"query": "test"},
        )

        with patch.object(Step, "send", new_callable=AsyncMock):
            await tracer._start_trace(tool_run)

        assert str(tool_run.id) in tracer.steps
        assert tracer.steps[str(tool_run.id)].type == "tool"


async def test_nested_chain_hierarchy(mock_chainlit_context):
    """Test nested chain with LLM calls."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()

        # Create parent chain
        chain_run = create_mock_run(
            id=uuid4(),
            name="parent_chain",
            run_type="chain",
            inputs={"input": "test"},
        )

        with patch.object(Step, "send", new_callable=AsyncMock):
            await tracer._start_trace(chain_run)

        # Create nested LLM
        llm_run = create_mock_run(
            id=uuid4(),
            parent_run_id=chain_run.id,
            name="nested_llm",
            run_type="llm",
            inputs={},
        )

        with patch.object(Step, "send", new_callable=AsyncMock):
            await tracer._start_trace(llm_run)

        # Both should exist
        assert str(chain_run.id) in tracer.steps
        assert str(llm_run.id) in tracer.steps

        # LLM should have chain as parent
        llm_step = tracer.steps[str(llm_run.id)]
        assert llm_step.parent_id == str(chain_run.id)


async def test_ignored_runs(mock_chainlit_context):
    """Test that default ignored runs are properly filtered."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()

        # Test RunnableSequence is ignored
        sequence_run = create_mock_run(
            id=uuid4(),
            name="RunnableSequence",
            run_type="chain",
            inputs={},
        )

        await tracer._start_trace(sequence_run)

        assert str(sequence_run.id) not in tracer.steps
        assert str(sequence_run.id) in tracer.ignored_runs


async def test_custom_filtering(mock_chainlit_context):
    """Test custom to_ignore and to_keep lists."""
    async with mock_chainlit_context:
        tracer = LangchainTracer(to_ignore=["CustomIgnore"], to_keep=["llm", "tool"])

        # Test custom ignore
        custom_run = create_mock_run(
            id=uuid4(),
            name="CustomIgnore",
            run_type="chain",
        )

        await tracer._start_trace(custom_run)

        assert str(custom_run.id) not in tracer.steps
        assert str(custom_run.id) in tracer.ignored_runs
