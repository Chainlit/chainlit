from abc import ABC, abstractmethod
from collections import defaultdict
from dataclasses import field
from typing import Annotated, Any, Dict, List, Union

from pydantic.dataclasses import Field, dataclass

from chainlit.context import get_emitter
from chainlit.types import InputWidgetType


@dataclass
class InputWidget(ABC):
    key: str
    label: str
    initial: Any = None
    tooltip: str = None
    description: str = None

    def __post_init__(self, tooltip, description) -> None:
        if not self.key or not self.label:
            raise ValueError("Must provide key and label to load InputWidget")

        self.tooltip = tooltip
        self.description = description

    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        pass


@dataclass
class ChatSettings:
    """Useful to create chat settings that the user can change."""

    widgets: List[InputWidget] = Field(default_factory=list, exclude=True)

    def __init__(
        self,
        widgets: List[InputWidget],
    ) -> None:
        self.widgets = widgets
        self.emitter = get_emitter()

    def settings(self):
        return dict(
            [(input_widget.key, input_widget.initial) for input_widget in self.widgets]
        )

    async def send(self):
        settings = self.settings()
        self.emitter.set_chat_settings(settings)

        widgets_content = [input_widget.to_dict() for input_widget in self.widgets]
        await self.emitter.emit("chat_settings", widgets_content)

        return settings


@dataclass
class Switch(InputWidget):
    """Useful to create a switch input in the settings element."""

    type: InputWidgetType = "switch"
    initial: bool = False

    def __init__(
        self,
        key: str,
        label: str,
        initial: bool,
        tooltip: str = None,
        description: str = None,
    ) -> None:
        self.key = key
        self.label = label
        self.initial = initial
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "key": self.key,
            "label": self.label,
            "initial": self.initial,
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class Slider(InputWidget):
    """Useful to create a slider input in the settings element."""

    type: InputWidgetType = "slider"
    initial: float = 0
    min: float = 0
    max: float = 10
    step: float = 1

    def __init__(
        self,
        key: str,
        label: str,
        initial: float,
        min: float = 0,
        max: float = 10,
        step: float = 1,
        tooltip: str = None,
        description: str = None,
    ) -> None:
        self.key = key
        self.label = label
        self.initial = initial
        self.min = min
        self.max = max
        self.step = step
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "key": self.key,
            "label": self.label,
            "initial": self.initial,
            "min": self.min,
            "max": self.max,
            "step": self.step,
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class SelectInput(InputWidget):
    """Useful to create a select input in the settings element."""

    type: InputWidgetType = "selectinput"
    initial: str = None
    initial_index: int = None
    initial_value: str = None
    values: List[str] = Field(default_factory=lambda: list)
    options: Dict[str, str] = Field(default_factory=lambda: defaultdict(dict))

    def __init__(
        self,
        key: str,
        label: str,
        values: List[str] = None,
        options: Dict[str, str] = None,
        initial_index: int = None,
        initial_value: str = None,
        tooltip: str = None,
        description: str = None,
    ) -> None:
        if values is None and options is None:
            raise ValueError("Must provide values or options to create a SelectInput")

        if values is not None and options is not None:
            raise ValueError(
                "You can only provide either values or options to create a SelectInput"
            )

        if values is None and initial_index is not None:
            raise ValueError(
                "Initial_index can only be used in combination with values to create a SelectInput"
            )

        self.key = key
        self.label = label
        self.options = options or {value: value for value in values}
        self.initial = (
            values[initial_index] if initial_index is not None else initial_value
        )
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "key": self.key,
            "label": self.label,
            "initial": self.initial,
            "options": [
                {"label": key, "value": value} for key, value in self.options.items()
            ],
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class TextInput(InputWidget):
    """Useful to create a text input in the settings element."""

    type: InputWidgetType = "textinput"
    initial: str = None
    placeholder: str = None

    def __init__(
        self,
        key: str or int,
        label: str,
        initial: str = None,
        placeholder: str = None,
        tooltip: str = None,
        description: str = None,
    ) -> None:
        self.key = key
        self.label = label
        self.initial = initial
        self.placeholder = placeholder
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "key": self.key,
            "label": self.label,
            "initial": self.initial,
            "placeholder": self.placeholder,
            "tooltip": self.tooltip,
            "description": self.description,
        }
