from typing import List

from pydantic.dataclasses import Field, dataclass

from chainlit.context import get_emitter
from chainlit.input_widget import InputWidget


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
