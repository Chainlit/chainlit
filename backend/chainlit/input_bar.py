from typing import List  # Ensure Callable is imported

from chainlit.context import context
from chainlit.input_widget import InputWidget


class InputBar:
    @staticmethod
    async def set_widgets(widgets: List[InputWidget]):
        """
        Sends a list of input widgets to be displayed in a dedicated bar on the frontend
        and registers their on_change callbacks.

        Args:
            widgets (List[InputWidget]): A list of InputWidget instances to display.
        """
        if not all(isinstance(w, InputWidget) for w in widgets):
            raise TypeError("All items in 'widgets' must be instances of InputWidget.")

        if not hasattr(context.session, "input_widget_callbacks"):
            setattr(context.session, "input_widget_callbacks", {})

        callbacks = getattr(context.session, "input_widget_callbacks", {})
        for widget in widgets:
            if widget.on_change:
                callbacks[widget.id] = widget.on_change

        widget_dicts = [widget.to_dict() for widget in widgets]

        await context.emitter.emit("set_input_widgets", widget_dicts)
