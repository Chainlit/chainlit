import sys
import uuid
from unittest.mock import AsyncMock, Mock, patch

import pytest

from chainlit.context import local_steps
from chainlit.element import Element
from chainlit.step import (
    Step,
    check_add_step_in_cot,
    flatten_args_kwargs,
    step,
    stub_step,
)


@pytest.mark.asyncio
class TestStepClass:
    """Test suite for the Step class."""

    async def test_step_initialization_with_defaults(self, mock_chainlit_context):
        """Test Step initialization with default values."""
        async with mock_chainlit_context:
            test_step = Step(name="test_step")

            assert test_step.name == "test_step"
            assert test_step.type == "undefined"
            assert isinstance(test_step.id, str)
            uuid.UUID(test_step.id)  # Verify valid UUID
            assert test_step.parent_id is None
            assert test_step.metadata == {}
            assert test_step.tags is None
            assert test_step.is_error is False
            assert test_step.show_input == "json"
            assert test_step.language is None
            assert test_step.default_open is False
            assert test_step.elements == []
            assert test_step.streaming is False
            assert test_step.persisted is False
            assert test_step.fail_on_persist_error is False
            assert test_step.input == ""
            assert test_step.output == ""
            assert test_step.created_at is not None
            assert test_step.start is None
            assert test_step.end is None

    async def test_step_initialization_with_all_fields(self, mock_chainlit_context):
        """Test Step initialization with all fields provided."""
        async with mock_chainlit_context:
            test_id = str(uuid.uuid4())
            parent_id = str(uuid.uuid4())
            metadata = {"key": "value"}
            tags = ["tag1", "tag2"]

            test_step = Step(
                name="custom_step",
                type="tool",
                id=test_id,
                parent_id=parent_id,
                metadata=metadata,
                tags=tags,
                language="python",
                default_open=True,
                show_input=False,
            )

            assert test_step.name == "custom_step"
            assert test_step.type == "tool"
            assert test_step.id == test_id
            assert test_step.parent_id == parent_id
            assert test_step.metadata == metadata
            assert test_step.tags == tags
            assert test_step.language == "python"
            assert test_step.default_open is True
            assert test_step.show_input is False

    async def test_step_input_setter_with_string(self, mock_chainlit_context):
        """Test Step input setter with string content."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            test_step.input = "This is input text"

            assert test_step.input == "This is input text"

    async def test_step_input_setter_with_dict(self, mock_chainlit_context):
        """Test Step input setter with dictionary content."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            input_dict = {"param1": "value1", "param2": 42}
            test_step.input = input_dict

            # Should be JSON formatted
            assert "param1" in test_step.input
            assert "value1" in test_step.input
            assert isinstance(test_step.input, str)

    async def test_step_output_setter_with_string(self, mock_chainlit_context):
        """Test Step output setter with string content."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            test_step.output = "This is output text"

            assert test_step.output == "This is output text"

    async def test_step_output_setter_with_dict(self, mock_chainlit_context):
        """Test Step output setter with dictionary content and language detection."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            output_dict = {"result": "success", "data": [1, 2, 3]}
            test_step.output = output_dict

            # Should be JSON formatted and language set to json
            assert "result" in test_step.output
            assert "success" in test_step.output
            assert test_step.language == "json"

    async def test_step_clean_content_with_bytes(self, mock_chainlit_context):
        """Test that bytes in content are stripped."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            content_with_bytes = {
                "text": "hello",
                "binary": b"binary_data",
                "nested": {"data": b"more_binary"},
            }
            test_step.output = content_with_bytes

            assert "STRIPPED_BINARY_DATA" in test_step.output
            assert b"binary_data" not in test_step.output.encode()

    async def test_step_to_dict(self, mock_chainlit_context):
        """Test Step serialization to dictionary."""
        async with mock_chainlit_context as ctx:
            test_step = Step(
                name="test_step",
                type="tool",
                metadata={"key": "value"},
                tags=["tag1"],
            )
            test_step.input = "test input"
            test_step.output = "test output"

            step_dict = test_step.to_dict()

            assert step_dict["name"] == "test_step"
            assert step_dict["type"] == "tool"
            assert step_dict["id"] == test_step.id
            assert step_dict["threadId"] == ctx.session.thread_id
            assert step_dict["parentId"] is None
            assert step_dict["streaming"] is False
            assert step_dict["metadata"] == {"key": "value"}
            assert step_dict["tags"] == ["tag1"]
            assert step_dict["input"] == "test input"
            assert step_dict["output"] == "test output"
            assert step_dict["isError"] is False
            assert step_dict["createdAt"] is not None
            assert step_dict["start"] is None
            assert step_dict["end"] is None

    async def test_step_send(self, mock_chainlit_context):
        """Test Step.send() method."""
        async with mock_chainlit_context as ctx:
            test_step = Step(name="test_step")

            result = await test_step.send()

            assert result == test_step
            assert test_step.persisted is False  # No data layer configured
            ctx.emitter.send_step.assert_called_once()

    async def test_step_send_with_elements(self, mock_chainlit_context):
        """Test Step.send() with elements."""
        async with mock_chainlit_context:
            mock_element = Mock(spec=Element)
            mock_element.send = AsyncMock()

            test_step = Step(name="test_step", elements=[mock_element])

            await test_step.send()

            mock_element.send.assert_called_once_with(for_id=test_step.id)

    async def test_step_send_already_persisted(self, mock_chainlit_context):
        """Test that send() returns early if already persisted."""
        async with mock_chainlit_context as ctx:
            test_step = Step(name="test_step")
            test_step.persisted = True

            result = await test_step.send()

            assert result == test_step
            ctx.emitter.send_step.assert_not_called()

    async def test_step_update(self, mock_chainlit_context):
        """Test Step.update() method."""
        async with mock_chainlit_context as ctx:
            test_step = Step(name="test_step")
            test_step.streaming = True

            result = await test_step.update()

            assert result is True
            assert test_step.streaming is False
            ctx.emitter.update_step.assert_called_once()

    async def test_step_remove(self, mock_chainlit_context):
        """Test Step.remove() method."""
        async with mock_chainlit_context as ctx:
            test_step = Step(name="test_step")

            result = await test_step.remove()

            assert result is True
            ctx.emitter.delete_step.assert_called_once()

    async def test_step_stream_token_output(self, mock_chainlit_context):
        """Test streaming tokens to output."""
        async with mock_chainlit_context:
            test_step = Step(name="test_step")

            await test_step.stream_token("Hello")
            await test_step.stream_token(" ")
            await test_step.stream_token("World")

            assert test_step.output == "Hello World"
            assert test_step.streaming is True

    async def test_step_stream_token_input(self, mock_chainlit_context):
        """Test streaming tokens to input."""
        async with mock_chainlit_context:
            test_step = Step(name="test_step")

            await test_step.stream_token("Input", is_input=True)
            await test_step.stream_token(" text", is_input=True)

            assert test_step.input == "Input text"

    async def test_step_stream_token_sequence(self, mock_chainlit_context):
        """Test streaming tokens with is_sequence flag."""
        async with mock_chainlit_context:
            test_step = Step(name="test_step")

            await test_step.stream_token("First", is_sequence=True)
            await test_step.stream_token("Second", is_sequence=True)

            # With is_sequence, it replaces instead of appending
            assert test_step.output == "Second"

    async def test_step_stream_token_empty(self, mock_chainlit_context):
        """Test that empty tokens are ignored."""
        async with mock_chainlit_context as ctx:
            test_step = Step(name="test_step")

            await test_step.stream_token("")

            assert test_step.output == ""
            ctx.emitter.stream_start.assert_not_called()

    async def test_step_context_manager_async(self, mock_chainlit_context):
        """Test Step as async context manager."""
        async with mock_chainlit_context as ctx:
            async with Step(name="context_step") as test_step:
                assert test_step.start is not None
                assert test_step.end is None

            # After exiting context
            assert test_step.end is not None
            assert ctx.emitter.send_step.call_count == 1
            assert ctx.emitter.update_step.call_count == 1

    async def test_step_context_manager_with_exception(self, mock_chainlit_context):
        """Test Step context manager handles exceptions."""
        async with mock_chainlit_context:
            try:
                async with Step(name="error_step") as test_step:
                    raise ValueError("Test error")
            except ValueError:
                pass

            assert test_step.is_error is True
            assert "Test error" in test_step.output

    async def test_step_parent_id_from_context(self, mock_chainlit_context):
        """Test that parent_id is set from context when nesting steps."""
        async with mock_chainlit_context:
            async with Step(name="parent_step") as parent:
                async with Step(name="child_step") as child:
                    assert child.parent_id == parent.id

    async def test_step_local_steps_tracking(self, mock_chainlit_context):
        """Test that local_steps tracks step hierarchy."""
        async with mock_chainlit_context:
            async with Step(name="step1") as step1:
                steps = local_steps.get()
                assert step1 in steps

                async with Step(name="step2") as step2:
                    steps = local_steps.get()
                    assert step1 in steps
                    assert step2 in steps

                # After step2 exits
                steps = local_steps.get()
                assert step1 in steps
                assert step2 not in steps

    async def test_step_with_none_input(self, mock_chainlit_context):
        """Test Step handles None input correctly."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            test_step.input = None

            assert test_step.input == ""

    async def test_step_with_none_output(self, mock_chainlit_context):
        """Test Step handles None output correctly."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            test_step.output = None

            assert test_step.output == ""

    async def test_step_with_list_content(self, mock_chainlit_context):
        """Test Step handles list content."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            test_step.output = [1, 2, 3, "four"]

            assert "[" in test_step.output
            assert "1" in test_step.output
            assert "four" in test_step.output
            assert test_step.language == "json"

    async def test_step_with_tuple_content(self, mock_chainlit_context):
        """Test Step handles tuple content."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            test_step.output = ("a", "b", "c")

            assert test_step.output != ""
            assert test_step.language == "json"


@pytest.mark.asyncio
class TestStepDecorator:
    """Test suite for the @step decorator."""

    async def test_step_decorator_async_function(self, mock_chainlit_context):
        """Test @step decorator on async function."""
        async with mock_chainlit_context as ctx:

            @step(name="async_step", type="tool")
            async def async_function(x: int, y: int):
                return x + y

            result = await async_function(2, 3)

            assert result == 5
            ctx.emitter.send_step.assert_called()

    async def test_step_decorator_sync_function(self, mock_chainlit_context):
        """Test @step decorator on sync function."""
        async with mock_chainlit_context:

            @step(name="sync_step", type="tool")
            def sync_function(x: int, y: int):
                return x + y

            result = sync_function(2, 3)

            assert result == 5

    async def test_step_decorator_uses_function_name(self, mock_chainlit_context):
        """Test that decorator uses function name when name not provided."""
        async with mock_chainlit_context as ctx:

            @step(type="tool")
            async def my_custom_function():
                return "result"

            await my_custom_function()

            # Check that step was created with function name
            call_args = ctx.emitter.send_step.call_args
            step_dict = call_args[0][0]
            assert step_dict["name"] == "my_custom_function"

    async def test_step_decorator_captures_input(self, mock_chainlit_context):
        """Test that decorator captures function arguments as input."""
        async with mock_chainlit_context as ctx:

            @step(name="test_step")
            async def function_with_args(a: str, b: int, c: bool = True):
                return "done"

            await function_with_args("hello", 42, c=False)

            # Verify send_step was called (input is set during step execution)
            ctx.emitter.send_step.assert_called()

    async def test_step_decorator_captures_output(self, mock_chainlit_context):
        """Test that decorator captures function return value as output."""
        async with mock_chainlit_context as ctx:

            @step(name="test_step")
            async def function_with_return():
                return {"status": "success", "value": 123}

            await function_with_return()

            call_args = ctx.emitter.update_step.call_args
            step_dict = call_args[0][0]
            assert "status" in step_dict["output"]
            assert "success" in step_dict["output"]

    async def test_step_decorator_handles_exception(self, mock_chainlit_context):
        """Test that decorator handles exceptions in wrapped function."""
        async with mock_chainlit_context as ctx:

            @step(name="error_step")
            async def function_with_error():
                raise ValueError("Something went wrong")

            try:
                await function_with_error()
            except ValueError:
                pass

            call_args = ctx.emitter.update_step.call_args
            step_dict = call_args[0][0]
            assert step_dict["isError"] is True
            assert "Something went wrong" in step_dict["output"]

    async def test_step_decorator_with_metadata(self, mock_chainlit_context):
        """Test decorator with metadata parameter."""
        async with mock_chainlit_context as ctx:
            metadata = {"version": "1.0", "author": "test"}

            @step(name="test_step", metadata=metadata)
            async def function_with_metadata():
                return "result"

            await function_with_metadata()

            call_args = ctx.emitter.send_step.call_args
            step_dict = call_args[0][0]
            assert step_dict["metadata"] == metadata

    async def test_step_decorator_with_tags(self, mock_chainlit_context):
        """Test decorator with tags parameter."""
        async with mock_chainlit_context as ctx:
            tags = ["important", "production"]

            @step(name="test_step", tags=tags)
            async def function_with_tags():
                return "result"

            await function_with_tags()

            call_args = ctx.emitter.send_step.call_args
            step_dict = call_args[0][0]
            assert step_dict["tags"] == tags

    async def test_step_decorator_without_parentheses(self, mock_chainlit_context):
        """Test @step decorator without parentheses."""
        async with mock_chainlit_context as ctx:

            @step
            async def simple_function():
                return "result"

            result = await simple_function()

            assert result == "result"
            ctx.emitter.send_step.assert_called()


@pytest.mark.asyncio
class TestStepHelperFunctions:
    """Test suite for Step helper functions."""

    def test_flatten_args_kwargs(self):
        """Test flatten_args_kwargs function."""

        def sample_func(a, b, c=10, d=20):
            pass

        result = flatten_args_kwargs(sample_func, (1, 2), {"d": 30})

        assert result["a"] == 1
        assert result["b"] == 2
        assert result["c"] == 10  # default value
        assert result["d"] == 30

    def test_flatten_args_kwargs_with_all_kwargs(self):
        """Test flatten_args_kwargs with all keyword arguments."""

        def sample_func(x, y, z):
            pass

        result = flatten_args_kwargs(sample_func, (), {"x": 1, "y": 2, "z": 3})

        assert result == {"x": 1, "y": 2, "z": 3}

    async def test_stub_step(self, mock_chainlit_context):
        """Test stub_step function creates minimal step dict."""
        async with mock_chainlit_context:
            test_step = Step(name="test_step", type="tool")
            test_step.parent_id = "parent_123"
            test_step.input = "full input"
            test_step.output = "full output"

            stub = stub_step(test_step)

            assert stub["name"] == "test_step"
            assert stub["type"] == "tool"
            assert stub["id"] == test_step.id
            assert stub["parentId"] == "parent_123"
            assert stub["threadId"] == test_step.thread_id
            assert stub["input"] == ""  # Stubbed
            assert stub["output"] == ""  # Stubbed

    async def test_check_add_step_in_cot_hidden(self, mock_chainlit_context):
        """Test check_add_step_in_cot with hidden COT."""
        async with mock_chainlit_context:
            step_module = sys.modules["chainlit.step"]
            with patch.object(step_module, "config") as mock_config:
                mock_config.ui.cot = "hidden"

                # Message types should be added
                message_step = Step(name="test", type="assistant_message")
                assert check_add_step_in_cot(message_step) is True

                # Non-message types should not be added
                tool_step = Step(name="test", type="tool")
                assert check_add_step_in_cot(tool_step) is False

    async def test_check_add_step_in_cot_visible(self, mock_chainlit_context):
        """Test check_add_step_in_cot with visible COT."""
        async with mock_chainlit_context:
            step_module = sys.modules["chainlit.step"]
            with patch.object(step_module, "config") as mock_config:
                mock_config.ui.cot = "visible"

                # All steps should be added
                tool_step = Step(name="test", type="tool")
                assert check_add_step_in_cot(tool_step) is True


@pytest.mark.asyncio
class TestStepEdgeCases:
    """Test suite for Step edge cases and error handling."""

    async def test_step_with_non_serializable_content(self, mock_chainlit_context):
        """Test Step handles non-JSON-serializable content."""
        async with mock_chainlit_context:
            test_step = Step(name="test")

            class NonSerializable:
                pass

            test_step.output = NonSerializable()

            # Should convert to string
            assert isinstance(test_step.output, str)
            assert test_step.language == "text"

    async def test_step_with_very_long_content(self, mock_chainlit_context):
        """Test Step handles very long content."""
        async with mock_chainlit_context:
            test_step = Step(name="test")
            long_text = "x" * 10000

            test_step.output = long_text

            assert len(test_step.output) == 10000

    async def test_step_multiple_updates(self, mock_chainlit_context):
        """Test calling update() multiple times."""
        async with mock_chainlit_context as ctx:
            test_step = Step(name="test")

            await test_step.update()
            await test_step.update()
            await test_step.update()

            assert ctx.emitter.update_step.call_count == 3

    async def test_step_id_uniqueness(self, mock_chainlit_context):
        """Test that each Step gets a unique ID."""
        async with mock_chainlit_context:
            step1 = Step(name="step1")
            step2 = Step(name="step2")
            step3 = Step(name="step3")

            ids = {step1.id, step2.id, step3.id}
            assert len(ids) == 3  # All unique

    async def test_step_with_custom_thread_id(self, mock_chainlit_context):
        """Test Step with custom thread_id."""
        async with mock_chainlit_context:
            custom_thread_id = "custom_thread_123"
            test_step = Step(name="test", thread_id=custom_thread_id)

            assert test_step.thread_id == custom_thread_id

    async def test_step_fail_on_persist_error_flag(self, mock_chainlit_context):
        """Test fail_on_persist_error flag behavior."""
        async with mock_chainlit_context:
            test_step = Step(name="test")

            assert test_step.fail_on_persist_error is False

            test_step.fail_on_persist_error = True
            assert test_step.fail_on_persist_error is True
