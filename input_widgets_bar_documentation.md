# Interactive Input Widgets Bar

## Overview

The Interactive Input Widgets Bar is a feature in Chainlit that allows developers to display a dynamic bar of input widgets directly below the chat interface. These widgets enable users to interact with the application in real-time, providing input that can be processed by the backend. The interaction is asynchronous, meaning that changes in widget values can trigger backend callbacks without interrupting the main chat flow.

## Enabling the Input Widgets Bar

The Input Widgets Bar is enabled and configured by calling the `cl.InputBar.set_widgets()` asynchronous method. You'll need to import `cl.InputBar` and the specific widget classes you intend to use.

```python
import chainlit as cl

# Import specific widget classes
from chainlit import Slider, Select, Switch, TextInput, NumberInput, Tags # and InputBar itself
```

## Available Widgets and Configuration

Chainlit provides several types of input widgets:

**Common Parameters for all Widgets:**

*   `id` (str): A unique identifier for the widget. This is crucial for differentiating widgets and routing callbacks. **Must be unique across all widgets in the bar.**
*   `label` (str): A user-friendly label displayed next to the widget.
*   `initial` (Any): The initial value of the widget when it first renders. The type depends on the widget (e.g., `float` for Slider, `str` for Select/TextInput, `bool` for Switch).
*   `tooltip` (Optional[str]): A tooltip to display on hover for the widget label, providing extra information.
*   `on_change` (Optional[Callable]): A Python function (sync or async) to be called when the widget's value changes. The function receives the new value as its argument.

---

**1. Slider**

Displays a slider for selecting a numerical value within a range.

*   `min` (float): The minimum value of the slider. Defaults to `0`.
*   `max` (float): The maximum value of the slider. Defaults to `10`.
*   `step` (float): The increment/decrement step of the slider. Defaults to `1`.
*   `initial` (float): The initial position/value of the slider.

```python
cl.Slider(id="temp_slider", label="Temperature", initial=0.5, min=0, max=1, step=0.1, on_change=handle_temp_change)
```

---

**2. Select**

Displays a dropdown menu for selecting one option from a list.

*   `values` (List[str]): A list of strings representing the values (and default labels) for the select options.
*   `items` (Dict[str, str]): For more control, a dictionary where keys are option values and values are their corresponding display labels. If `items` is provided, `values` is ignored.
*   `initial_value` (Optional[str]): The value of the initially selected option. If using `values`, this should be one of the strings in the list. If using `items`, this should be one of the keys.
*   `initial_index` (Optional[int]): (Only if using `values`) The index of the initially selected option in the `values` list. `initial_value` takes precedence if both are provided.
*   `initial` (str): Can also be used to set the initial value directly, similar to `initial_value`.

```python
# Using values
cl.Select(id="model_select", label="Model", values=["Mistral", "Llama"], initial_value="Mistral", on_change=handle_model_select)

# Using items for different labels and values
cl.Select(id="action_select", label="Action", items={"run_analysis": "Run Analysis", "view_report": "View Report"}, initial_value="run_analysis", on_change=handle_action_select)
```

---

**3. Switch**

Displays a toggle switch for boolean (on/off) inputs.

*   `initial` (bool): The initial state of the switch (`True` for on, `False` for off).

```python
cl.Switch(id="debug_switch", label="Debug Mode", initial=True, on_change=handle_debug_toggle)
```

---

**4. TextInput**

Displays a field for freeform text input.

*   `placeholder` (Optional[str]): Placeholder text displayed when the input field is empty.
*   `multiline` (bool): If `True`, renders a multi-line textarea. Defaults to `False` (single-line input).
*   `initial` (str): The initial text content of the input field.

```python
cl.TextInput(id="user_query", label="Your Query", initial="", placeholder="Type your question...", on_change=handle_query_input)
cl.TextInput(id="user_feedback", label="Feedback", multiline=True, initial="", on_change=handle_feedback_input)
```

---

**5. NumberInput**

Displays a field specifically for numerical input.

*   `placeholder` (Optional[str]): Placeholder text displayed when the input field is empty.
*   `initial` (float/int): The initial numerical value in the input field.

```python
cl.NumberInput(id="retry_attempts", label="Retries", initial=3, on_change=handle_retries_change)
```

---

**6. Tags** (Mentioned as available)

Used for inputting a list of strings (tags).

*   `initial` (List[str]): A list of strings to be initially displayed as tags.

```python
cl.Tags(id="topic_tags", label="Topics", initial=["AI", "Python"], on_change=handle_tags_change)
```

## Handling Value Changes (`on_change` Callbacks)

When a user interacts with an input widget, its value changes. If an `on_change` callback function is registered for that widget, Chainlit will execute this function on the backend.

The callback function receives one argument:
*   `value`: The new value of the widget. The type of this value depends on the widget (e.g., `float` for Slider, `str` for Select/TextInput, `bool` for Switch).

Callbacks can be defined as either synchronous or asynchronous functions:

**Synchronous Callback:**
```python
def handle_slider_change(value: float):
    print(f"Slider value is now: {value}")
    # Perform actions based on the new value
```

**Asynchronous Callback:**
```python
async def handle_select_change(value: str):
    print(f"Selected option: {value}")
    await cl.Message(content=f"You selected: {value}").send()
    # Perform async actions
```

These callbacks are executed in the context of the current user session, allowing you to send messages, interact with other Chainlit elements, or trigger further application logic.

## Example

Here's a complete example demonstrating how to set up multiple widgets with different types and callbacks. This code would typically go into your Chainlit application script (e.g., `app.py`).

```python
import chainlit as cl

# Define callback functions
async def handle_slider_change(value: float):
    await cl.Message(content=f"Slider value changed to: {value}").send()

async def handle_select_change(value: str):
    await cl.Message(content=f"Selected option: {value}").send()

async def handle_switch_change(value: bool):
    await cl.Message(content=f"Switch is now: {'ON' if value else 'OFF'}").send()

async def handle_text_input_change(value: str):
    # For TextInput and NumberInput, changes are usually sent on blur (losing focus)
    await cl.Message(content=f"Text input received: {value}").send()

async def handle_number_input_change(value: float):
    # For TextInput and NumberInput, changes are usually sent on blur
    await cl.Message(content=f"Number input received: {value}").send()

@cl.on_chat_start
async def setup_widgets():
    await cl.InputBar.set_widgets([
        cl.Slider(
            id="my_slider", 
            label="Brightness", 
            initial=50, 
            min=0, 
            max=100, 
            step=1, 
            on_change=handle_slider_change,
            tooltip="Adjust the brightness level."
        ),
        cl.Select(
            id="my_select", 
            label="Choose Model", 
            values=["GPT-3.5", "GPT-4", "Claude"], 
            initial_value="GPT-4", 
            on_change=handle_select_change,
            tooltip="Select the processing model."
        ),
        cl.Switch(
            id="my_switch", 
            label="Enable Debug Mode", 
            initial=False, 
            on_change=handle_switch_change,
            tooltip="Toggle verbose logging."
        ),
        cl.TextInput(
            id="my_text_input", 
            label="User Name", 
            initial="Analyst", 
            placeholder="Enter your name",
            on_change=handle_text_input_change,
            tooltip="Your identifier."
        ),
        cl.NumberInput(
            id="my_number_input",
            label="Iterations",
            initial=10,
            on_change=handle_number_input_change,
            tooltip="Number of processing iterations."
        ),
        cl.Tags(
            id="my_tags",
            label="Keywords",
            initial=["chainlit", "widgets"],
            # on_change=handle_tags_change # Define a callback if needed
            tooltip="Add relevant keywords."
        )
    ])
    await cl.Message(content="Input widgets are now set up! Try them out.").send()
```

## Widget IDs

It is crucial that each widget defined in the list passed to `cl.InputBar.set_widgets()` has a **unique `id`**. This `id` is used internally by Chainlit to:
*   Distinguish between widgets.
*   Route `on_change` events to the correct callback function.
*   Maintain widget state on the frontend.

Duplicate IDs will lead to unexpected behavior.

## Updating Widgets

If you call `cl.InputBar.set_widgets()` again at any point (e.g., in response to another action or message), the existing set of input widgets in the bar will be replaced with the new ones you provide. This allows for dynamic updates to the available inputs based on the application's state or user interaction flow.
```
