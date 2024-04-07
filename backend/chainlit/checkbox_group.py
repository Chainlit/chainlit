import uuid
from typing import List, Optional

from chainlit.context import context
from chainlit.telemetry import trace_event
from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import Field, dataclass


@dataclass
class CheckboxGroupOption(DataClassJsonMixin):
    # Name of the option
    name: str
    # The value associated with the option
    value: str
    # The label of the option. This is what the user will see. If not provided the name will be used.
    label: str = ""


@dataclass
class CheckboxGroup(DataClassJsonMixin):
    name: str
    options: List[CheckboxGroupOption]
    description: str = ""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    forId: Optional[str] = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")

    async def send(self, for_id: str):
        trace_event(f"send {self.__class__.__name__}")
        self.forId = for_id
        await context.emitter.emit("checkbox_group", self.to_dict())

    async def remove(self):
        trace_event(f"remove {self.__class__.__name__}")
        await context.emitter.emit("remove_checkbox_group", self.to_dict())
