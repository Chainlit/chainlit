from typing import Any, Dict

from chainlit.context import context
from pydantic.dataclasses import dataclass


@dataclass()
class CopilotFunction:
    name: str
    args: Dict[str, Any]

    def acall(self):
        return context.emitter.send_call_fn(self.name, self.args)
