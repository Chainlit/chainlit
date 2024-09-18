from typing import List, Dict
from chainlit.input_widget import InputWidget

class Assistant:
    input_widgets: List[InputWidget] = []
    settings_values: Dict = {}

    def __init__(self, input_widgets: List[InputWidget], settings_values: Dict):
        self.input_widgets = input_widgets
        self.settings_values = settings_values
    
    def to_dict(self):
        return {
            "input_widgets": [widget.__repr__() for widget in self.input_widgets],
            "settings_values": self.settings_values
        }
