from unittest.mock import patch

from llama_index.core.callbacks.schema import CBEventType, EventPayload
from llama_index.core.tools.types import ToolMetadata

from chainlit.llama_index.callbacks import LlamaIndexCallbackHandler
from chainlit.step import Step


async def test_on_event_start_for_function_calls(mock_chainlit_context):
    TEST_EVENT_ID = "test_event_id"
    async with mock_chainlit_context:
        handler = LlamaIndexCallbackHandler()

        with patch.object(Step, "send") as mock_send:
            result = handler.on_event_start(
                CBEventType.FUNCTION_CALL,
                {
                    EventPayload.TOOL: ToolMetadata(
                        name="test_tool", description="test_description"
                    ),
                    EventPayload.FUNCTION_CALL: {"arg1": "value1"},
                },
                TEST_EVENT_ID,
            )

        assert result == TEST_EVENT_ID
        assert TEST_EVENT_ID in handler.steps
        step = handler.steps[TEST_EVENT_ID]
        assert isinstance(step, Step)
        assert step.name == "test_tool"
        assert step.type == "tool"
        assert step.id == TEST_EVENT_ID
        assert step.input == '{\n    "arg1": "value1"\n}'
        mock_send.assert_called_once()


async def test_on_event_start_for_function_calls_missing_payload(mock_chainlit_context):
    TEST_EVENT_ID = "test_event_id"
    async with mock_chainlit_context:
        handler = LlamaIndexCallbackHandler()

        with patch.object(Step, "send") as mock_send:
            result = handler.on_event_start(
                CBEventType.FUNCTION_CALL,
                None,
                TEST_EVENT_ID,
            )

        assert result == TEST_EVENT_ID
        assert TEST_EVENT_ID in handler.steps
        step = handler.steps[TEST_EVENT_ID]
        assert isinstance(step, Step)
        assert step.name == "function_call"
        assert step.type == "tool"
        assert step.id == TEST_EVENT_ID
        assert step.input == "{}"
        mock_send.assert_called_once()


async def test_on_event_end_for_function_calls(mock_chainlit_context):
    TEST_EVENT_ID = "test_event_id"
    async with mock_chainlit_context:
        handler = LlamaIndexCallbackHandler()
        # Pretend that we have started a step before.
        step = Step(name="test_tool", type="tool", id=TEST_EVENT_ID)
        handler.steps[TEST_EVENT_ID] = step

        with patch.object(step, "update") as mock_send:
            handler.on_event_end(
                CBEventType.FUNCTION_CALL,
                payload={EventPayload.FUNCTION_OUTPUT: "test_output"},
                event_id=TEST_EVENT_ID,
            )

        assert step.output == "test_output"
        assert TEST_EVENT_ID not in handler.steps
        mock_send.assert_called_once()


async def test_on_event_end_for_function_calls_missing_payload(mock_chainlit_context):
    TEST_EVENT_ID = "test_event_id"
    async with mock_chainlit_context:
        handler = LlamaIndexCallbackHandler()
        # Pretend that we have started a step before.
        step = Step(name="test_tool", type="tool", id=TEST_EVENT_ID)
        handler.steps[TEST_EVENT_ID] = step

        with patch.object(step, "update") as mock_send:
            handler.on_event_end(
                CBEventType.FUNCTION_CALL,
                payload=None,
                event_id=TEST_EVENT_ID,
            )
        # TODO: Is this the desired behavior? Shouldn't we still remove the step as long as we've been told it has ended, even if the payload is missing?
        assert TEST_EVENT_ID in handler.steps
        mock_send.assert_not_called()
