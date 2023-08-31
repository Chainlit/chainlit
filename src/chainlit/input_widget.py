from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Any, Dict, List, Optional

from pydantic.dataclasses import Field, dataclass

from chainlit.types import InputWidgetType


@dataclass
class InputWidget(ABC):
    id: str
    label: str
    initial: Any = None
    tooltip: Optional[str] = None
    description: Optional[str] = None

    def __post_init__(self, tooltip, description) -> None:
        if not self.id or not self.label:
            raise ValueError("Must provide key and label to load InputWidget")

        self.tooltip = tooltip
        self.description = description

    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        pass


@dataclass
class Switch(InputWidget):
    """Useful to create a switch input."""

    type: InputWidgetType = "switch"
    initial: bool = False

    def __init__(
        self,
        id: str,
        label: str,
        initial: bool,
        tooltip: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        self.id = id
        self.label = label
        self.initial = initial
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class Slider(InputWidget):
    """Useful to create a slider input."""

    type: InputWidgetType = "slider"
    initial: float = 0
    min: float = 0
    max: float = 10
    step: float = 1

    def __init__(
        self,
        id: str,
        label: str,
        initial: float,
        min: float = 0,
        max: float = 10,
        step: float = 1,
        tooltip: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        self.id = id
        self.label = label
        self.initial = initial
        self.min = min
        self.max = max
        self.step = step
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "min": self.min,
            "max": self.max,
            "step": self.step,
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class Select(InputWidget):
    """Useful to create a select input."""

    type: InputWidgetType = "select"
    initial: Optional[str] = None
    initial_index: Optional[int] = None
    initial_value: Optional[str] = None
    values: List[str] = Field(default_factory=lambda: list)
    items: Dict[str, str] = Field(default_factory=lambda: defaultdict(dict))

    def __init__(
        self,
        id: str,
        label: str,
        values: Optional[List[str]] = None,
        items: Optional[Dict[str, str]] = None,
        initial_index: Optional[int] = None,
        initial_value: Optional[str] = None,
        tooltip: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        if values is None and items is None:
            raise ValueError("Must provide values or items to create a Select")

        if values is not None and items is not None:
            raise ValueError(
                "You can only provide either values or items to create a Select"
            )

        if values is None and initial_index is not None:
            raise ValueError(
                "Initial_index can only be used in combination with values to create a Select"
            )

        self.id = id
        self.label = label

        if items is not None:
            self.items = items
            self.initial = initial_value
        elif values is not None:
            self.items = {value: value for value in values}
            self.initial = (
                values[initial_index] if initial_index is not None else initial_value
            )
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "items": [
                {"label": id, "value": value} for id, value in self.items.items()
            ],
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class TextInput(InputWidget):
    """Useful to create a text input."""

    type: InputWidgetType = "textinput"
    initial: Optional[str] = None
    placeholder: Optional[str] = None

    def __init__(
        self,
        id: str,
        label: str,
        initial: Optional[str] = None,
        placeholder: Optional[str] = None,
        tooltip: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        self.id = id
        self.label = label
        self.initial = initial
        self.placeholder = placeholder
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "placeholder": self.placeholder,
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class NumberInput(InputWidget):
    """Useful to create a number input."""

    type: InputWidgetType = "numberinput"
    initial: Optional[float] = None
    placeholder: Optional[str] = None

    def __init__(
        self,
        id: str,
        label: str,
        initial: Optional[float] = None,
        placeholder: Optional[str] = None,
        tooltip: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        self.id = id
        self.label = label
        self.initial = initial
        self.placeholder = placeholder
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "placeholder": self.placeholder,
            "tooltip": self.tooltip,
            "description": self.description,
        }


@dataclass
class Tags(InputWidget):
    """Useful to create an input for an array of strings."""

    type: InputWidgetType = "tags"
    initial: List[str] = Field(default_factory=lambda: list)
    values: List[str] = Field(default_factory=lambda: list)

    def __init__(
        self,
        id: str,
        label: str,
        initial: Optional[List[str]] = None,
        tooltip: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        self.id = id
        self.label = label
        if initial is not None:
            self.initial = initial
        super().__post_init__(tooltip, description)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "tooltip": self.tooltip,
            "description": self.description,
        }
