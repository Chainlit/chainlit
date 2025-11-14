from abc import abstractmethod
from datetime import date
from typing import Any, Dict, List, Literal, Optional

from pydantic import Field
from pydantic.dataclasses import dataclass

from chainlit.types import InputWidgetType


@dataclass
class InputWidget:
    id: str
    label: str
    initial: Any = None
    tooltip: Optional[str] = None
    description: Optional[str] = None
    disabled: Optional[bool] = False

    def __post_init__(
        self,
    ) -> None:
        if not self.id or not self.label:
            raise ValueError("Must provide key and label to load InputWidget")

    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        pass


@dataclass
class Switch(InputWidget):
    """Useful to create a switch input."""

    type: InputWidgetType = "switch"
    initial: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "tooltip": self.tooltip,
            "description": self.description,
            "disabled": self.disabled,
        }


@dataclass
class Slider(InputWidget):
    """Useful to create a slider input."""

    type: InputWidgetType = "slider"
    initial: float = 0
    min: float = 0
    max: float = 10
    step: float = 1

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
            "disabled": self.disabled,
        }


@dataclass
class Select(InputWidget):
    """Useful to create a select input."""

    type: InputWidgetType = "select"
    initial: Optional[str] = None
    initial_index: Optional[int] = None
    initial_value: Optional[str] = None
    values: List[str] = Field(default_factory=list)
    items: Dict[str, str] = Field(default_factory=dict)

    def __post_init__(
        self,
    ) -> None:
        super().__post_init__()

        if not self.values and not self.items:
            raise ValueError("Must provide values or items to create a Select")

        if self.values and self.items:
            raise ValueError(
                "You can only provide either values or items to create a Select"
            )

        if not self.values and self.initial_index is not None:
            raise ValueError(
                "Initial_index can only be used in combination with values to create a Select"
            )

        if self.items:
            self.initial = self.initial_value
        elif self.values:
            self.items = {value: value for value in self.values}
            self.initial = (
                self.values[self.initial_index]
                if self.initial_index is not None
                else self.initial_value
            )

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
            "disabled": self.disabled,
        }


@dataclass
class TextInput(InputWidget):
    """Useful to create a text input."""

    type: InputWidgetType = "textinput"
    initial: Optional[str] = None
    placeholder: Optional[str] = None
    multiline: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "placeholder": self.placeholder,
            "tooltip": self.tooltip,
            "description": self.description,
            "multiline": self.multiline,
            "disabled": self.disabled,
        }


@dataclass
class NumberInput(InputWidget):
    """Useful to create a number input."""

    type: InputWidgetType = "numberinput"
    initial: Optional[float] = None
    placeholder: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "placeholder": self.placeholder,
            "tooltip": self.tooltip,
            "description": self.description,
            "disabled": self.disabled,
        }


@dataclass
class Tags(InputWidget):
    """Useful to create an input for an array of strings."""

    type: InputWidgetType = "tags"
    initial: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "tooltip": self.tooltip,
            "description": self.description,
            "disabled": self.disabled,
        }


@dataclass
class MultiSelect(InputWidget):
    """Useful to create a multi-select input."""

    type: InputWidgetType = "multiselect"
    initial: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)
    items: Dict[str, str] = Field(default_factory=dict)

    def __post_init__(
        self,
    ) -> None:
        super().__post_init__()

        if not self.values and not self.items:
            raise ValueError("Must provide values or items to create a MultiSelect")

        if self.values and self.items:
            raise ValueError(
                "You can only provide either values or items to create a MultiSelect"
            )

        if self.values:
            self.items = {value: value for value in self.values}

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
            "disabled": self.disabled,
        }


@dataclass
class Checkbox(InputWidget):
    """Useful to create a checkbox input."""

    type: InputWidgetType = "checkbox"
    initial: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "initial": self.initial,
            "tooltip": self.tooltip,
            "description": self.description,
            "disabled": self.disabled,
        }


@dataclass
class RadioGroup(InputWidget):
    """Useful to create a radio button input."""

    type: InputWidgetType = "radio"
    initial: Optional[str] = None
    initial_index: Optional[int] = None
    initial_value: Optional[str] = None
    values: List[str] = Field(default_factory=list)
    items: Dict[str, str] = Field(default_factory=dict)

    def __post_init__(
        self,
    ) -> None:
        super().__post_init__()

        if not self.values and not self.items:
            raise ValueError("Must provide values or items to create a RadioButton")

        if self.values and self.items:
            raise ValueError(
                "You can only provide either values or items to create a RadioButton"
            )

        if not self.values and self.initial_index is not None:
            raise ValueError(
                "Initial_index can only be used in combination with values to create a RadioButton"
            )

        if self.items:
            self.initial = self.initial_value
        elif self.values:
            self.items = {value: value for value in self.values}
            self.initial = (
                self.values[self.initial_index]
                if self.initial_index is not None
                else self.initial_value
            )

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
            "disabled": self.disabled,
        }


@dataclass
class Tab:
    id: str
    label: str
    inputs: list[InputWidget] = Field(default_factory=list, exclude=True)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "inputs": [input.to_dict() for input in self.inputs],
        }


@dataclass
class DatePicker(InputWidget):
    """
    Datepicker input widget.
    Supports both single date and date range selection.
    """

    type: InputWidgetType = "datepicker"
    mode: Literal["single", "range"] = "single"
    initial: str | date | tuple[str | date, str | date] | None = None
    min_date: str | date | None = None
    max_date: str | date | None = None
    format: str | None = None
    """date-fns format string"""
    placeholder: str | None = None
    """Placeholder to use when no date is selected"""

    def __post_init__(self) -> None:
        super().__post_init__()

        if self.mode not in ("single", "range"):
            raise ValueError("mode must be 'single' or 'range'")

        if (
            self.mode == "range"
            and self.initial is not None
            and not isinstance(self.initial, tuple)
        ):
            raise ValueError("'initial' must be a tuple for range mode")

        (initial_start, initial_end), min_date, max_date = (
            [
                DatePicker._validate_iso_format(date, "initial")
                for date in (
                    self.initial
                    if isinstance(self.initial, tuple)
                    else [self.initial, None]
                )
            ],
            DatePicker._validate_iso_format(self.min_date, "min_date"),
            DatePicker._validate_iso_format(self.max_date, "max_date"),
        )

        if self.mode == "range":
            self._validate_range(initial_start, initial_end, "initial")
            self._validate_range(min_date, max_date, "[min_date, max_date]")

        # Validate that initial value(s) are within min_date and max_date bounds
        for d in [initial_start, initial_end]:
            if d is not None and (
                (min_date is not None and d < min_date)
                or (max_date is not None and d > max_date)
            ):
                raise ValueError(
                    "'initial' must be within 'min_date' and 'max_date' bounds"
                )

    @staticmethod
    def _validate_range(
        start: date | None,
        end: date | None,
        field_name: str,
    ) -> None:
        if start is not None and end is not None and start > end:
            raise ValueError(
                f"'{field_name}' range is invalid, start must be before end."
            )

    @staticmethod
    def _validate_iso_format(
        date_value: str | date | None, field_name: str
    ) -> date | None:
        if isinstance(date_value, str):
            try:
                return date.fromisoformat(date_value)
            except ValueError as e:
                raise ValueError(f"'{field_name}' must be in ISO format") from e

        return date_value

    @staticmethod
    def _format_date(date_value: str | date | None) -> str | None:
        if isinstance(date_value, date):
            return date_value.isoformat()
        return date_value

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "label": self.label,
            "tooltip": self.tooltip,
            "description": self.description,
            "mode": self.mode,
            "initial": (
                self._format_date(self.initial[0]),
                self._format_date(self.initial[1]),
            )
            if isinstance(self.initial, tuple)
            else DatePicker._format_date(self.initial),
            "min_date": DatePicker._format_date(self.min_date),
            "max_date": DatePicker._format_date(self.max_date),
            "format": self.format,
            "placeholder": self.placeholder,
        }
