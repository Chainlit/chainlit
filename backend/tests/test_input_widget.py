import pytest

from chainlit.input_widget import (
    Checkbox,
    MultiSelect,
    NumberInput,
    RadioGroup,
    Select,
    Slider,
    Switch,
    Tab,
    Tags,
    TextInput,
)


class TestInputWidgetBase:
    """Test suite for base InputWidget validation."""

    def test_input_widget_requires_id_and_label(self):
        """Test that InputWidget requires both id and label."""
        with pytest.raises(ValueError, match="Must provide key and label"):
            Switch(id="", label="Test Label")

        with pytest.raises(ValueError, match="Must provide key and label"):
            Switch(id="test_id", label="")


class TestSwitchWidget:
    """Test suite for Switch input widget."""

    def test_switch_initialization(self):
        """Test Switch widget initialization."""
        switch = Switch(id="test_switch", label="Enable Feature")

        assert switch.id == "test_switch"
        assert switch.label == "Enable Feature"
        assert switch.type == "switch"
        assert switch.initial is False
        assert switch.disabled is False

    def test_switch_with_initial_value(self):
        """Test Switch widget with initial value."""
        switch = Switch(id="test_switch", label="Enable Feature", initial=True)

        assert switch.initial is True

    def test_switch_with_tooltip_and_description(self):
        """Test Switch widget with tooltip and description."""
        switch = Switch(
            id="test_switch",
            label="Enable Feature",
            tooltip="Toggle this feature",
            description="This enables the advanced feature",
        )

        assert switch.tooltip == "Toggle this feature"
        assert switch.description == "This enables the advanced feature"

    def test_switch_disabled(self):
        """Test Switch widget in disabled state."""
        switch = Switch(id="test_switch", label="Enable Feature", disabled=True)

        assert switch.disabled is True

    def test_switch_to_dict(self):
        """Test Switch widget serialization."""
        switch = Switch(
            id="test_switch",
            label="Enable Feature",
            initial=True,
            tooltip="Toggle",
            description="Description",
            disabled=False,
        )

        result = switch.to_dict()

        assert result["type"] == "switch"
        assert result["id"] == "test_switch"
        assert result["label"] == "Enable Feature"
        assert result["initial"] is True
        assert result["tooltip"] == "Toggle"
        assert result["description"] == "Description"
        assert result["disabled"] is False


class TestSliderWidget:
    """Test suite for Slider input widget."""

    def test_slider_initialization(self):
        """Test Slider widget initialization."""
        slider = Slider(id="test_slider", label="Temperature")

        assert slider.id == "test_slider"
        assert slider.label == "Temperature"
        assert slider.type == "slider"
        assert slider.initial == 0
        assert slider.min == 0
        assert slider.max == 10
        assert slider.step == 1

    def test_slider_with_custom_range(self):
        """Test Slider widget with custom range."""
        slider = Slider(
            id="test_slider",
            label="Temperature",
            initial=0.5,
            min=0.0,
            max=1.0,
            step=0.1,
        )

        assert slider.initial == 0.5
        assert slider.min == 0.0
        assert slider.max == 1.0
        assert slider.step == 0.1

    def test_slider_to_dict(self):
        """Test Slider widget serialization."""
        slider = Slider(
            id="test_slider",
            label="Temperature",
            initial=0.7,
            min=0.0,
            max=2.0,
            step=0.1,
            tooltip="Adjust temperature",
        )

        result = slider.to_dict()

        assert result["type"] == "slider"
        assert result["id"] == "test_slider"
        assert result["label"] == "Temperature"
        assert result["initial"] == 0.7
        assert result["min"] == 0.0
        assert result["max"] == 2.0
        assert result["step"] == 0.1
        assert result["tooltip"] == "Adjust temperature"


class TestSelectWidget:
    """Test suite for Select input widget."""

    def test_select_with_values(self):
        """Test Select widget with values list."""
        select = Select(
            id="test_select",
            label="Choose Model",
            values=["gpt-4", "gpt-3.5", "claude"],
        )

        assert select.id == "test_select"
        assert select.label == "Choose Model"
        assert select.type == "select"
        assert select.items == {
            "gpt-4": "gpt-4",
            "gpt-3.5": "gpt-3.5",
            "claude": "claude",
        }

    def test_select_with_items(self):
        """Test Select widget with items dict."""
        items = {"gpt4": "GPT-4", "gpt35": "GPT-3.5", "claude": "Claude"}
        select = Select(id="test_select", label="Choose Model", items=items)

        assert select.items == items

    def test_select_with_initial_index(self):
        """Test Select widget with initial_index."""
        select = Select(
            id="test_select",
            label="Choose Model",
            values=["gpt-4", "gpt-3.5", "claude"],
            initial_index=1,
        )

        assert select.initial == "gpt-3.5"

    def test_select_with_initial_value(self):
        """Test Select widget with initial_value."""
        select = Select(
            id="test_select",
            label="Choose Model",
            values=["gpt-4", "gpt-3.5", "claude"],
            initial_value="claude",
        )

        assert select.initial == "claude"

    def test_select_requires_values_or_items(self):
        """Test that Select requires either values or items."""
        with pytest.raises(ValueError, match="Must provide values or items"):
            Select(id="test_select", label="Choose Model")

    def test_select_cannot_have_both_values_and_items(self):
        """Test that Select cannot have both values and items."""
        with pytest.raises(ValueError, match="only provide either values or items"):
            Select(
                id="test_select",
                label="Choose Model",
                values=["a", "b"],
                items={"a": "A"},
            )

    def test_select_initial_index_requires_values(self):
        """Test that initial_index requires values."""
        with pytest.raises(
            ValueError,
            match="Initial_index can only be used in combination with values",
        ):
            Select(
                id="test_select",
                label="Choose Model",
                items={"a": "A"},
                initial_index=0,
            )

    def test_select_to_dict(self):
        """Test Select widget serialization."""
        select = Select(
            id="test_select",
            label="Choose Model",
            values=["gpt-4", "gpt-3.5"],
            initial_index=0,
            tooltip="Select a model",
        )

        result = select.to_dict()

        assert result["type"] == "select"
        assert result["id"] == "test_select"
        assert result["label"] == "Choose Model"
        assert result["initial"] == "gpt-4"
        assert len(result["items"]) == 2
        assert result["items"][0] == {"label": "gpt-4", "value": "gpt-4"}
        assert result["tooltip"] == "Select a model"


class TestTextInputWidget:
    """Test suite for TextInput widget."""

    def test_textinput_initialization(self):
        """Test TextInput widget initialization."""
        text_input = TextInput(id="test_input", label="Enter Name")

        assert text_input.id == "test_input"
        assert text_input.label == "Enter Name"
        assert text_input.type == "textinput"
        assert text_input.initial is None
        assert text_input.placeholder is None
        assert text_input.multiline is False

    def test_textinput_with_initial_and_placeholder(self):
        """Test TextInput widget with initial value and placeholder."""
        text_input = TextInput(
            id="test_input",
            label="Enter Name",
            initial="John Doe",
            placeholder="Enter your name",
        )

        assert text_input.initial == "John Doe"
        assert text_input.placeholder == "Enter your name"

    def test_textinput_multiline(self):
        """Test TextInput widget in multiline mode."""
        text_input = TextInput(
            id="test_input", label="Enter Description", multiline=True
        )

        assert text_input.multiline is True

    def test_textinput_to_dict(self):
        """Test TextInput widget serialization."""
        text_input = TextInput(
            id="test_input",
            label="Enter Name",
            initial="Default",
            placeholder="Type here",
            multiline=True,
            tooltip="Enter your name",
        )

        result = text_input.to_dict()

        assert result["type"] == "textinput"
        assert result["id"] == "test_input"
        assert result["label"] == "Enter Name"
        assert result["initial"] == "Default"
        assert result["placeholder"] == "Type here"
        assert result["multiline"] is True
        assert result["tooltip"] == "Enter your name"


class TestNumberInputWidget:
    """Test suite for NumberInput widget."""

    def test_numberinput_initialization(self):
        """Test NumberInput widget initialization."""
        number_input = NumberInput(id="test_number", label="Enter Age")

        assert number_input.id == "test_number"
        assert number_input.label == "Enter Age"
        assert number_input.type == "numberinput"
        assert number_input.initial is None
        assert number_input.placeholder is None

    def test_numberinput_with_initial(self):
        """Test NumberInput widget with initial value."""
        number_input = NumberInput(
            id="test_number", label="Enter Age", initial=25.5, placeholder="Age"
        )

        assert number_input.initial == 25.5
        assert number_input.placeholder == "Age"

    def test_numberinput_to_dict(self):
        """Test NumberInput widget serialization."""
        number_input = NumberInput(
            id="test_number",
            label="Enter Age",
            initial=30.0,
            placeholder="Enter a number",
            tooltip="Your age",
        )

        result = number_input.to_dict()

        assert result["type"] == "numberinput"
        assert result["id"] == "test_number"
        assert result["label"] == "Enter Age"
        assert result["initial"] == 30.0
        assert result["placeholder"] == "Enter a number"
        assert result["tooltip"] == "Your age"


class TestTagsWidget:
    """Test suite for Tags widget."""

    def test_tags_initialization(self):
        """Test Tags widget initialization."""
        tags = Tags(id="test_tags", label="Add Tags")

        assert tags.id == "test_tags"
        assert tags.label == "Add Tags"
        assert tags.type == "tags"
        assert tags.initial == []
        assert tags.values == []

    def test_tags_with_initial_values(self):
        """Test Tags widget with initial values."""
        tags = Tags(
            id="test_tags",
            label="Add Tags",
            initial=["python", "javascript"],
            values=["python", "javascript", "go", "rust"],
        )

        assert tags.initial == ["python", "javascript"]
        assert tags.values == ["python", "javascript", "go", "rust"]

    def test_tags_to_dict(self):
        """Test Tags widget serialization."""
        tags = Tags(
            id="test_tags",
            label="Add Tags",
            initial=["tag1"],
            tooltip="Add your tags",
        )

        result = tags.to_dict()

        assert result["type"] == "tags"
        assert result["id"] == "test_tags"
        assert result["label"] == "Add Tags"
        assert result["initial"] == ["tag1"]
        assert result["tooltip"] == "Add your tags"


class TestMultiSelectWidget:
    """Test suite for MultiSelect widget."""

    def test_multiselect_with_values(self):
        """Test MultiSelect widget with values list."""
        multi_select = MultiSelect(
            id="test_multiselect",
            label="Choose Languages",
            values=["Python", "JavaScript", "Go"],
        )

        assert multi_select.id == "test_multiselect"
        assert multi_select.label == "Choose Languages"
        assert multi_select.type == "multiselect"
        assert multi_select.items == {
            "Python": "Python",
            "JavaScript": "JavaScript",
            "Go": "Go",
        }

    def test_multiselect_with_items(self):
        """Test MultiSelect widget with items dict."""
        items = {"py": "Python", "js": "JavaScript", "go": "Go"}
        multi_select = MultiSelect(
            id="test_multiselect", label="Choose Languages", items=items
        )

        assert multi_select.items == items

    def test_multiselect_with_initial(self):
        """Test MultiSelect widget with initial selection."""
        multi_select = MultiSelect(
            id="test_multiselect",
            label="Choose Languages",
            values=["Python", "JavaScript", "Go"],
            initial=["Python", "Go"],
        )

        assert multi_select.initial == ["Python", "Go"]

    def test_multiselect_requires_values_or_items(self):
        """Test that MultiSelect requires either values or items."""
        with pytest.raises(ValueError, match="Must provide values or items"):
            MultiSelect(id="test_multiselect", label="Choose Languages")

    def test_multiselect_cannot_have_both_values_and_items(self):
        """Test that MultiSelect cannot have both values and items."""
        with pytest.raises(ValueError, match="only provide either values or items"):
            MultiSelect(
                id="test_multiselect",
                label="Choose Languages",
                values=["a", "b"],
                items={"a": "A"},
            )

    def test_multiselect_to_dict(self):
        """Test MultiSelect widget serialization."""
        multi_select = MultiSelect(
            id="test_multiselect",
            label="Choose Languages",
            values=["Python", "JavaScript"],
            initial=["Python"],
            tooltip="Select languages",
        )

        result = multi_select.to_dict()

        assert result["type"] == "multiselect"
        assert result["id"] == "test_multiselect"
        assert result["label"] == "Choose Languages"
        assert result["initial"] == ["Python"]
        assert len(result["items"]) == 2
        assert result["tooltip"] == "Select languages"


class TestCheckboxWidget:
    """Test suite for Checkbox widget."""

    def test_checkbox_initialization(self):
        """Test Checkbox widget initialization."""
        checkbox = Checkbox(id="test_checkbox", label="Accept Terms")

        assert checkbox.id == "test_checkbox"
        assert checkbox.label == "Accept Terms"
        assert checkbox.type == "checkbox"
        assert checkbox.initial is False

    def test_checkbox_with_initial_value(self):
        """Test Checkbox widget with initial value."""
        checkbox = Checkbox(id="test_checkbox", label="Accept Terms", initial=True)

        assert checkbox.initial is True

    def test_checkbox_to_dict(self):
        """Test Checkbox widget serialization."""
        checkbox = Checkbox(
            id="test_checkbox",
            label="Accept Terms",
            initial=True,
            tooltip="Check to accept",
            description="Terms and conditions",
        )

        result = checkbox.to_dict()

        assert result["type"] == "checkbox"
        assert result["id"] == "test_checkbox"
        assert result["label"] == "Accept Terms"
        assert result["initial"] is True
        assert result["tooltip"] == "Check to accept"
        assert result["description"] == "Terms and conditions"


class TestRadioGroupWidget:
    """Test suite for RadioGroup widget."""

    def test_radiogroup_with_values(self):
        """Test RadioGroup widget with values list."""
        radio = RadioGroup(
            id="test_radio", label="Choose Size", values=["Small", "Medium", "Large"]
        )

        assert radio.id == "test_radio"
        assert radio.label == "Choose Size"
        assert radio.type == "radio"
        assert radio.items == {"Small": "Small", "Medium": "Medium", "Large": "Large"}

    def test_radiogroup_with_items(self):
        """Test RadioGroup widget with items dict."""
        items = {"s": "Small", "m": "Medium", "l": "Large"}
        radio = RadioGroup(id="test_radio", label="Choose Size", items=items)

        assert radio.items == items

    def test_radiogroup_with_initial_index(self):
        """Test RadioGroup widget with initial_index."""
        radio = RadioGroup(
            id="test_radio",
            label="Choose Size",
            values=["Small", "Medium", "Large"],
            initial_index=1,
        )

        assert radio.initial == "Medium"

    def test_radiogroup_with_initial_value(self):
        """Test RadioGroup widget with initial_value."""
        radio = RadioGroup(
            id="test_radio",
            label="Choose Size",
            values=["Small", "Medium", "Large"],
            initial_value="Large",
        )

        assert radio.initial == "Large"

    def test_radiogroup_requires_values_or_items(self):
        """Test that RadioGroup requires either values or items."""
        with pytest.raises(ValueError, match="Must provide values or items"):
            RadioGroup(id="test_radio", label="Choose Size")

    def test_radiogroup_cannot_have_both_values_and_items(self):
        """Test that RadioGroup cannot have both values and items."""
        with pytest.raises(ValueError, match="only provide either values or items"):
            RadioGroup(
                id="test_radio",
                label="Choose Size",
                values=["a", "b"],
                items={"a": "A"},
            )

    def test_radiogroup_initial_index_requires_values(self):
        """Test that initial_index requires values."""
        with pytest.raises(
            ValueError,
            match="Initial_index can only be used in combination with values",
        ):
            RadioGroup(
                id="test_radio", label="Choose Size", items={"a": "A"}, initial_index=0
            )

    def test_radiogroup_to_dict(self):
        """Test RadioGroup widget serialization."""
        radio = RadioGroup(
            id="test_radio",
            label="Choose Size",
            values=["Small", "Medium"],
            initial_index=0,
            tooltip="Select size",
        )

        result = radio.to_dict()

        assert result["type"] == "radio"
        assert result["id"] == "test_radio"
        assert result["label"] == "Choose Size"
        assert result["initial"] == "Small"
        assert len(result["items"]) == 2
        assert result["items"][0] == {"label": "Small", "value": "Small"}
        assert result["tooltip"] == "Select size"


class TestTabWidget:
    """Test suite for Tab widget."""

    def test_tab_initialization(self):
        """Test Tab initialization."""
        tab = Tab(id="test_tab", label="Settings")

        assert tab.id == "test_tab"
        assert tab.label == "Settings"
        assert tab.inputs == []

    def test_tab_with_inputs(self):
        """Test Tab with input widgets."""
        switch = Switch(id="switch1", label="Enable")
        slider = Slider(id="slider1", label="Value")
        tab = Tab(id="test_tab", label="Settings", inputs=[switch, slider])

        assert len(tab.inputs) == 2
        assert tab.inputs[0] == switch
        assert tab.inputs[1] == slider

    def test_tab_to_dict(self):
        """Test Tab serialization."""
        switch = Switch(id="switch1", label="Enable", initial=True)
        slider = Slider(id="slider1", label="Value", initial=5)
        tab = Tab(id="test_tab", label="Settings", inputs=[switch, slider])

        result = tab.to_dict()

        assert result["id"] == "test_tab"
        assert result["label"] == "Settings"
        assert len(result["inputs"]) == 2
        assert result["inputs"][0]["type"] == "switch"
        assert result["inputs"][0]["id"] == "switch1"
        assert result["inputs"][1]["type"] == "slider"
        assert result["inputs"][1]["id"] == "slider1"

    def test_tab_to_dict_empty_inputs(self):
        """Test Tab serialization with no inputs."""
        tab = Tab(id="test_tab", label="Empty Tab")

        result = tab.to_dict()

        assert result["id"] == "test_tab"
        assert result["label"] == "Empty Tab"
        assert result["inputs"] == []


class TestInputWidgetEdgeCases:
    """Test suite for InputWidget edge cases."""

    def test_all_widgets_have_consistent_common_fields(self):
        """Test that all widgets support common fields."""
        widgets = [
            Switch(
                id="test",
                label="Test",
                tooltip="Tooltip",
                description="Description",
                disabled=True,
            ),
            Slider(
                id="test",
                label="Test",
                tooltip="Tooltip",
                description="Description",
                disabled=True,
            ),
            Checkbox(
                id="test",
                label="Test",
                tooltip="Tooltip",
                description="Description",
                disabled=True,
            ),
            TextInput(
                id="test",
                label="Test",
                tooltip="Tooltip",
                description="Description",
                disabled=True,
            ),
            NumberInput(
                id="test",
                label="Test",
                tooltip="Tooltip",
                description="Description",
                disabled=True,
            ),
            Tags(
                id="test",
                label="Test",
                tooltip="Tooltip",
                description="Description",
                disabled=True,
            ),
        ]

        for widget in widgets:
            assert widget.tooltip == "Tooltip"
            assert widget.description == "Description"
            assert widget.disabled is True
            result = widget.to_dict()
            assert result["tooltip"] == "Tooltip"
            assert result["description"] == "Description"
            assert result["disabled"] is True

    def test_select_with_complex_items(self):
        """Test Select with complex item labels and values."""
        items = {
            "option_1": "Option One with Spaces",
            "option_2": "Option Two (with parentheses)",
            "option_3": "Option Three - with dashes",
        }
        select = Select(id="test_select", label="Choose", items=items)

        result = select.to_dict()
        assert len(result["items"]) == 3
        assert {"label": "option_1", "value": "Option One with Spaces"} in result[
            "items"
        ]

    def test_multiselect_initial_with_multiple_values(self):
        """Test MultiSelect with multiple initial values."""
        multi_select = MultiSelect(
            id="test",
            label="Choose",
            values=["A", "B", "C", "D"],
            initial=["A", "C", "D"],
        )

        assert len(multi_select.initial) == 3
        assert "A" in multi_select.initial
        assert "C" in multi_select.initial
        assert "D" in multi_select.initial

    def test_slider_with_negative_range(self):
        """Test Slider with negative range."""
        slider = Slider(id="test", label="Test", min=-10, max=10, initial=-5, step=1)

        assert slider.min == -10
        assert slider.max == 10
        assert slider.initial == -5

    def test_textinput_empty_initial_value(self):
        """Test TextInput with empty string as initial value."""
        text_input = TextInput(id="test", label="Test", initial="")

        assert text_input.initial == ""
        result = text_input.to_dict()
        assert result["initial"] == ""
