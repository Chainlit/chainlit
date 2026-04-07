import uuid

import pytest

from chainlit.action import Action


@pytest.mark.asyncio
class TestAction:
    """Test suite for the Action class."""

    async def test_action_initialization_with_required_fields(self):
        """Test Action initialization with only required fields."""
        action = Action(
            name="test_action",
            payload={"key": "value"},
        )

        assert action.name == "test_action"
        assert action.payload == {"key": "value"}
        assert action.label == ""
        assert action.tooltip == ""
        assert action.icon is None
        assert action.forId is None
        assert isinstance(action.id, str)
        # Verify ID is a valid UUID
        uuid.UUID(action.id)

    async def test_action_initialization_with_all_fields(self):
        """Test Action initialization with all fields provided."""
        test_id = str(uuid.uuid4())
        action = Action(
            name="custom_action",
            payload={"param1": "value1", "param2": 42},
            label="Click Me",
            tooltip="This is a tooltip",
            icon="check-circle",
            id=test_id,
        )

        assert action.name == "custom_action"
        assert action.payload == {"param1": "value1", "param2": 42}
        assert action.label == "Click Me"
        assert action.tooltip == "This is a tooltip"
        assert action.icon == "check-circle"
        assert action.id == test_id
        assert action.forId is None

    async def test_action_id_auto_generation(self):
        """Test that Action generates unique IDs automatically."""
        action1 = Action(name="action1", payload={})
        action2 = Action(name="action2", payload={})

        assert action1.id != action2.id
        # Verify both are valid UUIDs
        uuid.UUID(action1.id)
        uuid.UUID(action2.id)

    async def test_action_to_dict(self):
        """Test Action serialization to dictionary."""
        test_id = str(uuid.uuid4())
        action = Action(
            name="test_action",
            payload={"data": "test"},
            label="Test Label",
            tooltip="Test Tooltip",
            icon="star",
            id=test_id,
        )

        action_dict = action.to_dict()

        assert action_dict["name"] == "test_action"
        assert action_dict["payload"] == {"data": "test"}
        assert action_dict["label"] == "Test Label"
        assert action_dict["tooltip"] == "Test Tooltip"
        assert action_dict["icon"] == "star"
        assert action_dict["id"] == test_id
        assert action_dict.get("forId") is None

    async def test_action_to_dict_with_for_id(self):
        """Test Action serialization includes forId when set."""
        action = Action(name="test", payload={})
        action.forId = "message_123"

        action_dict = action.to_dict()

        assert action_dict["forId"] == "message_123"

    async def test_action_send(self, mock_chainlit_context):
        """Test Action.send() method emits correct event."""
        async with mock_chainlit_context as ctx:
            action = Action(
                name="send_action",
                payload={"test": "data"},
                label="Send Test",
            )

            for_id = "target_message_id"
            await action.send(for_id=for_id)

            # Verify forId was set
            assert action.forId == for_id

            # Verify emit was called with correct parameters
            ctx.emitter.emit.assert_called_once()
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][0] == "action"

            emitted_dict = call_args[0][1]
            assert emitted_dict["name"] == "send_action"
            assert emitted_dict["payload"] == {"test": "data"}
            assert emitted_dict["label"] == "Send Test"
            assert emitted_dict["forId"] == for_id

    async def test_action_send_updates_for_id(self, mock_chainlit_context):
        """Test that send() updates the forId field."""
        async with mock_chainlit_context:
            action = Action(name="test", payload={})

            # Initially forId should be None
            assert action.forId is None

            # Send with first for_id
            await action.send(for_id="first_id")
            assert action.forId == "first_id"

            # Send with different for_id should update
            await action.send(for_id="second_id")
            assert action.forId == "second_id"

    async def test_action_remove(self, mock_chainlit_context):
        """Test Action.remove() method emits correct event."""
        async with mock_chainlit_context as ctx:
            action = Action(
                name="remove_action",
                payload={"key": "value"},
                label="Remove Test",
            )
            action.forId = "message_123"

            await action.remove()

            # Verify emit was called with correct parameters
            ctx.emitter.emit.assert_called_once()
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][0] == "remove_action"

            emitted_dict = call_args[0][1]
            assert emitted_dict["name"] == "remove_action"
            assert emitted_dict["payload"] == {"key": "value"}
            assert emitted_dict["forId"] == "message_123"

    async def test_action_remove_without_for_id(self, mock_chainlit_context):
        """Test Action.remove() works even without forId set."""
        async with mock_chainlit_context as ctx:
            action = Action(name="test", payload={})

            await action.remove()

            ctx.emitter.emit.assert_called_once()
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][0] == "remove_action"

    async def test_action_with_complex_payload(self):
        """Test Action with complex nested payload."""
        complex_payload = {
            "nested": {
                "data": [1, 2, 3],
                "info": {"key": "value"},
            },
            "list": ["a", "b", "c"],
            "number": 42,
            "boolean": True,
            "null": None,
        }

        action = Action(name="complex", payload=complex_payload)

        assert action.payload == complex_payload
        action_dict = action.to_dict()
        assert action_dict["payload"] == complex_payload

    async def test_action_with_empty_payload(self):
        """Test Action with empty payload."""
        action = Action(name="empty", payload={})

        assert action.payload == {}
        assert action.to_dict()["payload"] == {}

    async def test_action_with_empty_strings(self):
        """Test Action handles empty strings correctly."""
        action = Action(
            name="test",
            payload={},
            label="",
            tooltip="",
        )

        assert action.label == ""
        assert action.tooltip == ""

        action_dict = action.to_dict()
        assert action_dict["label"] == ""
        assert action_dict["tooltip"] == ""

    async def test_action_serialization_deserialization(self):
        """Test Action can be serialized and deserialized."""
        original = Action(
            name="serialize_test",
            payload={"data": "test"},
            label="Test",
            tooltip="Tooltip",
            icon="icon-name",
        )

        # Serialize to dict
        serialized = original.to_dict()

        # Deserialize from dict
        deserialized = Action.from_dict(serialized)

        assert deserialized.name == original.name
        assert deserialized.payload == original.payload
        assert deserialized.label == original.label
        assert deserialized.tooltip == original.tooltip
        assert deserialized.icon == original.icon
        assert deserialized.id == original.id

    async def test_multiple_actions_with_same_name(self):
        """Test that multiple actions can have the same name but different IDs."""
        action1 = Action(name="duplicate", payload={"num": 1})
        action2 = Action(name="duplicate", payload={"num": 2})

        assert action1.name == action2.name
        assert action1.id != action2.id
        assert action1.payload != action2.payload

    async def test_action_send_multiple_times(self, mock_chainlit_context):
        """Test that an action can be sent multiple times."""
        async with mock_chainlit_context as ctx:
            action = Action(name="multi_send", payload={})

            await action.send(for_id="id1")
            await action.send(for_id="id2")
            await action.send(for_id="id3")

            # Should have been called 3 times
            assert ctx.emitter.emit.call_count == 3

            # Last forId should be id3
            assert action.forId == "id3"

    async def test_action_with_special_characters_in_payload(self):
        """Test Action handles special characters in payload."""
        special_payload = {
            "unicode": "Hello 世界 🌍",
            "quotes": 'He said "Hello"',
            "newlines": "Line1\nLine2\nLine3",
            "tabs": "Col1\tCol2\tCol3",
        }

        action = Action(name="special", payload=special_payload)

        assert action.payload == special_payload
        action_dict = action.to_dict()
        assert action_dict["payload"] == special_payload

    async def test_action_icon_variations(self):
        """Test Action with different icon values."""
        # With icon
        action_with_icon = Action(name="test", payload={}, icon="check")
        assert action_with_icon.icon == "check"

        # Without icon (None)
        action_no_icon = Action(name="test", payload={}, icon=None)
        assert action_no_icon.icon is None

        # Default (should be None)
        action_default = Action(name="test", payload={})
        assert action_default.icon is None
