import pytest

from chainlit.chat_settings import ChatSettings
from chainlit.input_widget import (
    Checkbox,
    NumberInput,
    Select,
    Slider,
    Switch,
    Tab,
    TextInput,
)


@pytest.mark.asyncio
class TestChatSettings:
    """Test suite for ChatSettings class."""

    async def test_chat_settings_initialization(self, mock_chainlit_context):
        """Test ChatSettings initialization with input widgets."""
        async with mock_chainlit_context:
            switch = Switch(id="enable_feature", label="Enable Feature")
            slider = Slider(id="temperature", label="Temperature", initial=0.7)

            settings = ChatSettings(inputs=[switch, slider])

            assert len(settings.inputs) == 2
            assert settings.inputs[0] == switch
            assert settings.inputs[1] == slider

    async def test_chat_settings_with_empty_inputs(self, mock_chainlit_context):
        """Test ChatSettings with empty inputs list."""
        async with mock_chainlit_context:
            settings = ChatSettings(inputs=[])

            assert settings.inputs == []

    async def test_chat_settings_settings_method(self, mock_chainlit_context):
        """Test ChatSettings.settings() method returns initial values."""
        async with mock_chainlit_context:
            switch = Switch(id="enable_feature", label="Enable", initial=True)
            slider = Slider(id="temperature", label="Temperature", initial=0.7)
            text = TextInput(id="model", label="Model", initial="gpt-4")

            settings = ChatSettings(inputs=[switch, slider, text])
            result = settings.settings()

            assert result["enable_feature"] is True
            assert result["temperature"] == 0.7
            assert result["model"] == "gpt-4"

    async def test_chat_settings_with_tabs(self, mock_chainlit_context):
        """Test ChatSettings with Tab containers."""
        async with mock_chainlit_context:
            # Create inputs for tabs
            switch1 = Switch(id="switch1", label="Switch 1", initial=True)
            slider1 = Slider(id="slider1", label="Slider 1", initial=5)

            switch2 = Switch(id="switch2", label="Switch 2", initial=False)
            text2 = TextInput(id="text2", label="Text 2", initial="value")

            # Create tabs
            tab1 = Tab(id="tab1", label="Tab 1", inputs=[switch1, slider1])
            tab2 = Tab(id="tab2", label="Tab 2", inputs=[switch2, text2])

            settings = ChatSettings(inputs=[tab1, tab2])

            assert len(settings.inputs) == 2
            assert isinstance(settings.inputs[0], Tab)
            assert isinstance(settings.inputs[1], Tab)

    async def test_chat_settings_settings_with_tabs(self, mock_chainlit_context):
        """Test ChatSettings.settings() collects values from tabs."""
        async with mock_chainlit_context:
            switch1 = Switch(id="switch1", label="Switch 1", initial=True)
            slider1 = Slider(id="slider1", label="Slider 1", initial=5)

            switch2 = Switch(id="switch2", label="Switch 2", initial=False)
            text2 = TextInput(id="text2", label="Text 2", initial="value")

            tab1 = Tab(id="tab1", label="Tab 1", inputs=[switch1, slider1])
            tab2 = Tab(id="tab2", label="Tab 2", inputs=[switch2, text2])

            settings = ChatSettings(inputs=[tab1, tab2])
            result = settings.settings()

            # Should collect all inputs from all tabs
            assert result["switch1"] is True
            assert result["slider1"] == 5
            assert result["switch2"] is False
            assert result["text2"] == "value"

    async def test_chat_settings_send(self, mock_chainlit_context):
        """Test ChatSettings.send() method."""
        async with mock_chainlit_context as ctx:
            switch = Switch(id="enable", label="Enable", initial=True)
            slider = Slider(id="temp", label="Temperature", initial=0.8)

            settings = ChatSettings(inputs=[switch, slider])
            result = await settings.send()

            # Verify settings were returned
            assert result["enable"] is True
            assert result["temp"] == 0.8

            # Verify emitter methods were called
            ctx.emitter.set_chat_settings.assert_called_once_with(result)
            ctx.emitter.emit.assert_called_once()

            # Verify emit was called with correct arguments
            call_args = ctx.emitter.emit.call_args
            assert call_args[0][0] == "chat_settings"
            assert len(call_args[0][1]) == 2  # Two inputs

    async def test_chat_settings_send_with_tabs(self, mock_chainlit_context):
        """Test ChatSettings.send() with tabs."""
        async with mock_chainlit_context as ctx:
            switch = Switch(id="switch1", label="Switch", initial=True)
            slider = Slider(id="slider1", label="Slider", initial=5)

            tab = Tab(id="tab1", label="Settings", inputs=[switch, slider])
            settings = ChatSettings(inputs=[tab])
            result = await settings.send()

            # Verify settings collected from tab
            assert result["switch1"] is True
            assert result["slider1"] == 5

            # Verify emitter was called
            ctx.emitter.set_chat_settings.assert_called_once()
            ctx.emitter.emit.assert_called_once()

    async def test_chat_settings_with_all_widget_types(self, mock_chainlit_context):
        """Test ChatSettings with all widget types."""
        async with mock_chainlit_context:
            widgets = [
                Switch(id="switch", label="Switch", initial=True),
                Slider(id="slider", label="Slider", initial=5, min=0, max=10),
                Select(
                    id="select",
                    label="Select",
                    values=["a", "b", "c"],
                    initial_index=1,
                ),
                TextInput(id="text", label="Text", initial="hello"),
                NumberInput(id="number", label="Number", initial=42.0),
                Checkbox(id="checkbox", label="Checkbox", initial=False),
            ]

            settings = ChatSettings(inputs=widgets)
            result = settings.settings()

            assert result["switch"] is True
            assert result["slider"] == 5
            assert result["select"] == "b"
            assert result["text"] == "hello"
            assert result["number"] == 42.0
            assert result["checkbox"] is False

    async def test_chat_settings_with_nested_tabs(self, mock_chainlit_context):
        """Test ChatSettings.settings() with nested structure."""
        async with mock_chainlit_context:
            # Create multiple tabs with different inputs
            tab1_inputs = [
                Switch(id="t1_switch", label="T1 Switch", initial=True),
                Slider(id="t1_slider", label="T1 Slider", initial=3),
            ]

            tab2_inputs = [
                TextInput(id="t2_text", label="T2 Text", initial="test"),
                Checkbox(id="t2_check", label="T2 Check", initial=True),
            ]

            tab1 = Tab(id="tab1", label="Tab 1", inputs=tab1_inputs)
            tab2 = Tab(id="tab2", label="Tab 2", inputs=tab2_inputs)

            settings = ChatSettings(inputs=[tab1, tab2])
            result = settings.settings()

            # All inputs from all tabs should be collected
            assert result["t1_switch"] is True
            assert result["t1_slider"] == 3
            assert result["t2_text"] == "test"
            assert result["t2_check"] is True
            assert len(result) == 4

    async def test_chat_settings_only_widgets_or_only_tabs(self, mock_chainlit_context):
        """Test that ChatSettings accepts either all widgets or all tabs, not mixed."""
        async with mock_chainlit_context:
            # Test with only widgets
            widgets = [
                Switch(id="switch", label="Switch", initial=True),
                Slider(id="slider", label="Slider", initial=7),
            ]
            settings_widgets = ChatSettings(inputs=widgets)
            result_widgets = settings_widgets.settings()
            assert result_widgets["switch"] is True
            assert result_widgets["slider"] == 7

            # Test with only tabs
            tab1 = Tab(
                id="tab1",
                label="Tab 1",
                inputs=[Switch(id="t1_switch", label="Switch", initial=False)],
            )
            tab2 = Tab(
                id="tab2",
                label="Tab 2",
                inputs=[Slider(id="t2_slider", label="Slider", initial=3)],
            )
            settings_tabs = ChatSettings(inputs=[tab1, tab2])
            result_tabs = settings_tabs.settings()
            assert result_tabs["t1_switch"] is False
            assert result_tabs["t2_slider"] == 3

    async def test_chat_settings_with_none_initial_values(self, mock_chainlit_context):
        """Test ChatSettings with widgets having None initial values."""
        async with mock_chainlit_context:
            text = TextInput(id="text", label="Text", initial=None)
            number = NumberInput(id="number", label="Number", initial=None)
            select = Select(
                id="select", label="Select", values=["a", "b"], initial_value=None
            )

            settings = ChatSettings(inputs=[text, number, select])
            result = settings.settings()

            assert result["text"] is None
            assert result["number"] is None
            assert result["select"] is None


@pytest.mark.asyncio
class TestChatSettingsEdgeCases:
    """Test suite for ChatSettings edge cases."""

    async def test_chat_settings_empty_tabs(self, mock_chainlit_context):
        """Test ChatSettings with empty tabs."""
        async with mock_chainlit_context:
            empty_tab = Tab(id="empty", label="Empty Tab", inputs=[])
            settings = ChatSettings(inputs=[empty_tab])
            result = settings.settings()

            assert result == {}

    async def test_chat_settings_duplicate_ids(self, mock_chainlit_context):
        """Test ChatSettings behavior with duplicate IDs (last one wins)."""
        async with mock_chainlit_context:
            switch1 = Switch(id="duplicate", label="Switch 1", initial=True)
            switch2 = Switch(id="duplicate", label="Switch 2", initial=False)

            settings = ChatSettings(inputs=[switch1, switch2])
            result = settings.settings()

            # Last value should win
            assert result["duplicate"] is False

    async def test_chat_settings_send_returns_settings(self, mock_chainlit_context):
        """Test that send() returns the settings dictionary."""
        async with mock_chainlit_context:
            switch = Switch(id="test", label="Test", initial=True)
            settings = ChatSettings(inputs=[switch])

            result = await settings.send()

            assert isinstance(result, dict)
            assert "test" in result
            assert result["test"] is True

    async def test_chat_settings_to_dict_serialization(self, mock_chainlit_context):
        """Test that inputs are properly serialized in send()."""
        async with mock_chainlit_context as ctx:
            switch = Switch(id="switch", label="Switch", initial=True)
            slider = Slider(id="slider", label="Slider", initial=5)

            settings = ChatSettings(inputs=[switch, slider])
            await settings.send()

            # Check that emit was called with serialized inputs
            call_args = ctx.emitter.emit.call_args
            inputs_content = call_args[0][1]

            assert len(inputs_content) == 2
            assert inputs_content[0]["type"] == "switch"
            assert inputs_content[0]["id"] == "switch"
            assert inputs_content[1]["type"] == "slider"
            assert inputs_content[1]["id"] == "slider"

    async def test_chat_settings_with_complex_tab_structure(
        self, mock_chainlit_context
    ):
        """Test ChatSettings with complex tab structure."""
        async with mock_chainlit_context:
            # Create a complex structure with multiple tabs
            tab1 = Tab(
                id="general",
                label="General",
                inputs=[
                    Switch(id="enabled", label="Enabled", initial=True),
                    TextInput(id="name", label="Name", initial="MyApp"),
                ],
            )

            tab2 = Tab(
                id="advanced",
                label="Advanced",
                inputs=[
                    Slider(id="timeout", label="Timeout", initial=30, min=0, max=60),
                    Select(
                        id="mode",
                        label="Mode",
                        values=["dev", "prod"],
                        initial_index=0,
                    ),
                ],
            )

            settings = ChatSettings(inputs=[tab1, tab2])
            result = settings.settings()

            assert result["enabled"] is True
            assert result["name"] == "MyApp"
            assert result["timeout"] == 30
            assert result["mode"] == "dev"
            assert len(result) == 4
