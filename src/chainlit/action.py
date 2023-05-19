from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json
from chainlit.sdk import get_emit
from chainlit.telemetry import trace_event


@dataclass_json
@dataclass
class Action:
    name: str
    value: str
    description: str = ""
    forId: str = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")

    def send(self, for_id: str):
        emit = get_emit()
        if emit:
            trace_event(f"send {self.__class__.__name__}")
            self.forId = for_id
            emit("action", self.to_dict())

    def remove(self):
        emit = get_emit()
        if emit:
            trace_event(f"remove {self.__class__.__name__}")
            emit("remove_action", self.to_dict())
