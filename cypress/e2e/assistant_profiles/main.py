import uuid
from typing import List

from chainlit.assistant import Assistant
from chainlit.input_widget import FileUploadInput, Select, Slider, TextInput

import chainlit as cl

# Definitely not the best way to store assistants (use a database instead)
ASSISTANTSLIST: List[Assistant] = []

CHAINLIT_AUTH_SECRET = (
    "_jUILVPfd?JbeYskt:auBDW$?::0vUQ0UfVcZ%G,rfT5WIG%uiH/49SQIr6ig0po"
)


assistant_settings = [
    TextInput(
        id="name",
        label="Name",
        placeholder="Name of the assistant",
    ),
    TextInput(
        id="markdown_description",
        label="Description",
        placeholder="Description of the assistant",
        multiline=True,
    ),
    FileUploadInput(
        id="icon",
        label="Icon",
        accept=["image/*"],
        max_size_mb=5,
        max_files=1,
        placeholder="Icon for the assistant",
    ),
    TextInput(
        id="instructions",
        label="Instructions",
        placeholder="Instructions for the assistant",
        multiline=True,
    ),
    Select(
        id="model",
        label="Model",
        values=["gpt-4o-mini", "gpt-4o", "gpt-4", "gpt-3.5-turbo"],
        initial_index=0,
    ),
    Slider(
        id="temperature",
        label="Temperature",
        min=0,
        max=1,
        step=0.1,
        initial=0.3,
    ),
]

# create a default assistant
default_assistant = Assistant(
    settings_values={
        "name": "German assistant",
        "markdown_description": "Georges is a dumb assistant",
        "icon": "https://picsum.photos/250",
        "instructions": "You are a helpful assistant that can only answer questions in german.",
        "model": "gpt-4o",
        "temperature": 0.5,
        "created_by": "paul",
        "id": str(uuid.uuid4()),
    },
    input_widgets=assistant_settings,
)

ASSISTANTSLIST.append(default_assistant)


# send the assistant settings to the backend (to be used in the frontend)
@cl.on_chat_start
async def on_chat_start():
    await cl.AssistantSettings(assistant_settings).send()


# callback to create an assistant
@cl.on_create_assistant
async def create_assistant(user, new_assistant: Assistant):
    # if an assistant with the same name already exists, update it
    if any(
        assistant.settings_values["id"] == new_assistant.settings_values["id"]
        for assistant in ASSISTANTSLIST
    ):
        for assistant in ASSISTANTSLIST:
            if assistant.settings_values["id"] == new_assistant.settings_values["id"]:
                assistant.settings_values = new_assistant.settings_values
                assistant.input_widgets = new_assistant.input_widgets
                break
    else:
        ASSISTANTSLIST.append(new_assistant)


# return the list of assistants
@cl.on_list_assistants
async def list_assistants(user):
    return ASSISTANTSLIST


# Update the run_assistant function
@cl.step(type="run")
async def run_assistant(assistant: dict, content: str):
    # logging e2e test:
    return f"Passed content: {content} to assistant: {assistant}"


@cl.password_auth_callback
def auth_callback(username: str, password: str):
    # do not use this in production, it's just for demo purposes
    if (username, password) == ("admin", "admin"):
        return cl.User(
            identifier="admin", metadata={"role": "ADMIN", "provider": "credentials"}
        )
    else:
        return None


@cl.on_message
async def main(message: cl.Message):
    selected_assistant = cl.user_session.get("selected_assistant")
    if selected_assistant:
        content = await run_assistant(selected_assistant, message.content)
        await cl.Message(content=content).send()
    else:
        await cl.Message(content="No assistant selected").send()
