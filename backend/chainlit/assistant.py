from typing import List, Optional

from chainlit.input_widget import InputWidget
from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import Field, dataclass


@dataclass
class BaseAssistant(DataClassJsonMixin):
    """
    An abstract base class for assistants that can be extended.
    """

    name: str
    markdown_description: str
    icon: str

    def __init__(self, name: str, markdown_description: str, icon: str):
        """
        Initialize the BaseAssistant.

        Args:
            name (str): The name of the assistant.
            markdown_description (str): A markdown description of the assistant.
            icon (Optional[str], optional): An optional icon for the assistant. Defaults to None.
        """
        self.name = name
        self.markdown_description = markdown_description
        self.icon = icon

    async def run(self, *args, **kwargs):
        """
        An abstract method that should be implemented by subclasses.
        This method defines the main functionality of the assistant.
        """
        pass
