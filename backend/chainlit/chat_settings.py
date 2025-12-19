from typing import Any, List

from pydantic import Field
from pydantic.dataclasses import dataclass

from chainlit.context import context
from chainlit.input_widget import InputWidget, Tab


@dataclass
class ChatSettings:
    """Useful to create chat settings that the user can change."""

    inputs: List[InputWidget] | List[Tab] = Field(default_factory=list, exclude=True)

    def __init__(
        self,
        inputs: List[InputWidget] | List[Tab],
    ) -> None:
        self.inputs = inputs

    def settings(self):
        def collect_settings(
            values: dict[str, Any], inputs: List[InputWidget] | List[Tab]
        ) -> None:
            for input in inputs:
                if isinstance(input, Tab):
                    collect_settings(values, input.inputs)
                else:
                    values[input.id] = input.initial

        settings: dict[str, Any] = {}
        collect_settings(settings, self.inputs)
        return settings

    async def send(self):
        settings = self.settings()
        context.emitter.set_chat_settings(settings)

        inputs_content = [input_widget.to_dict() for input_widget in self.inputs]
        await context.emitter.emit("chat_settings", inputs_content)

        return settings
