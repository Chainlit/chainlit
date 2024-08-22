import logging
from typing import List

from chainlit.context import context
from chainlit.input_widget import InputWidget
from pydantic.dataclasses import Field, dataclass


@dataclass
class AssistantSettings:
    """Useful to create chat settings that the user can change."""

    inputs: List[InputWidget] = Field(default_factory=list, exclude=True)

    def __init__(
        self,
        inputs: List[InputWidget],
    ) -> None:
        self.inputs = inputs

    def settings(self):
        return dict(
            [(input_widget.id, input_widget.initial) for input_widget in self.inputs]
        )

    async def send(self):
        settings = self.settings()
        context.emitter.set_assistant_settings(settings)

        inputs_content = [input_widget.to_dict() for input_widget in self.inputs]
        # logging.info(f"Sending assistant settings: {inputs_content}")
        await context.emitter.emit("assistant_settings", inputs_content)

        # logging.info(f"Assistant settings sent: {settings}")
        return settings
