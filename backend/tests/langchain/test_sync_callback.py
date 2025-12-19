"""Tests for synchronous LangChain callback operations and helper classes."""

from datetime import datetime
from unittest.mock import Mock
from uuid import uuid4

from langchain.schema import AIMessage, HumanMessage

from chainlit.langchain.callbacks import (
    FinalStreamHelper,
    GenerationHelper,
    LangchainTracer,
)


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


class TestFinalStreamHelper:
    """Test FinalStreamHelper class."""

    def test_initialization(self):
        """Test FinalStreamHelper initialization."""
        helper = FinalStreamHelper()

        assert helper.answer_prefix_tokens == ["Final", "Answer", ":"]
        assert helper.stream_final_answer is False
        assert helper.answer_reached is False

    def test_check_if_answer_reached(self):
        """Test _check_if_answer_reached."""
        helper = FinalStreamHelper()

        helper._append_to_last_tokens("Final")
        helper._append_to_last_tokens("Answer")
        helper._append_to_last_tokens(":")

        assert helper._check_if_answer_reached() is True


class TestGenerationHelper:
    """Test GenerationHelper class."""

    def test_initialization(self):
        """Test GenerationHelper initialization."""
        helper = GenerationHelper()

        assert helper.chat_generations == {}
        assert helper.completion_generations == {}
        assert helper.generation_inputs == {}

    def test_ensure_values_serializable(self):
        """Test ensure_values_serializable method."""
        helper = GenerationHelper()

        # Test dict
        result = helper.ensure_values_serializable({"key": "value", "num": 42})
        assert result == {"key": "value", "num": 42}

        # Test list
        result = helper.ensure_values_serializable([1, 2, "three"])
        assert result == [1, 2, "three"]

    def test_convert_message(self):
        """Test _convert_message method."""
        helper = GenerationHelper()

        # Test HumanMessage
        msg = HumanMessage(content="Hello")
        result = helper._convert_message(msg)
        assert result["role"] == "user"
        assert result["content"] == "Hello"

        # Test AIMessage
        msg = AIMessage(content="Hi there")
        result = helper._convert_message(msg)
        assert result["role"] == "assistant"
        assert result["content"] == "Hi there"

    def test_build_llm_settings(self):
        """Test _build_llm_settings method."""
        helper = GenerationHelper()

        serialized = {"name": "ChatOpenAI"}
        invocation_params = {
            "_type": "openai",
            "model": "gpt-4",
            "temperature": 0.7,
        }

        provider, model, _, settings = helper._build_llm_settings(
            serialized, invocation_params
        )

        assert provider == "openai"
        assert model == "gpt-4"
        assert settings["temperature"] == 0.7


async def test_should_ignore_run(mock_chainlit_context):
    """Test _should_ignore_run method."""
    async with mock_chainlit_context:
        tracer = LangchainTracer(to_ignore=["RunnableSequence"])

        # Test ignored by name
        run = create_mock_run(name="RunnableSequence", run_type="chain")
        ignore, _ = tracer._should_ignore_run(run)
        assert ignore is True

        # Test not ignored
        run = create_mock_run(name="MyChain", run_type="chain")
        ignore, _ = tracer._should_ignore_run(run)
        assert ignore is False


async def test_get_non_ignored_parent_id(mock_chainlit_context):
    """Test _get_non_ignored_parent_id."""
    async with mock_chainlit_context:
        tracer = LangchainTracer()

        # Setup parent chain
        grandparent_id = str(uuid4())
        parent_id = str(uuid4())

        # Both parent and grandparent need to be in parent_id_map for the traversal to work
        tracer.parent_id_map[parent_id] = grandparent_id
        tracer.parent_id_map[grandparent_id] = None  # grandparent has no parent
        tracer.ignored_runs.add(parent_id)

        result = tracer._get_non_ignored_parent_id(parent_id)

        assert result == grandparent_id
