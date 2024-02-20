from datetime import datetime
from typing import List, Optional

import chainlit.data as cl_data
from chainlit.step import StepDict

import chainlit as cl

now = datetime.utcnow().isoformat()

create_step_counter = 0

user_dict = {"id": "test", "createdAt": now, "identifier": "admin"}

thread_history = [
    {
        "id": "test1",
        "name": "thread 1",
        "createdAt": now,
        "user": user_dict,
        "steps": [
            {
                "id": "test1",
                "name": "test",
                "createdAt": now,
                "type": "user_message",
                "output": "Message 1",
            },
            {
                "id": "test2",
                "name": "test",
                "createdAt": now,
                "type": "assistant_message",
                "output": "Message 2",
            },
        ],
    },
    {
        "id": "test2",
        "createdAt": now,
        "user": user_dict,
        "name": "thread 2",
        "steps": [
            {
                "id": "test3",
                "createdAt": now,
                "name": "test",
                "type": "user_message",
                "output": "Message 3",
            },
            {
                "id": "test4",
                "createdAt": now,
                "name": "test",
                "type": "assistant_message",
                "output": "Message 4",
            },
        ],
    },
]  # type: List[cl_data.ThreadDict]
deleted_thread_ids = []  # type: List[str]


class TestDataLayer(cl_data.BaseDataLayer):
    async def get_user(self, identifier: str):
        return cl.PersistedUser(id="test", createdAt=now, identifier=identifier)

    async def create_user(self, user: cl.User):
        return cl.PersistedUser(id="test", createdAt=now, identifier=user.identifier)

    @cl_data.queue_until_user_message()
    async def create_step(self, step_dict: StepDict):
        global create_step_counter
        create_step_counter += 1

    async def get_thread_author(self, thread_id: str):
        return "admin"

    async def list_threads(
        self, pagination: cl_data.Pagination, filter: cl_data.ThreadFilter
    ) -> cl_data.PaginatedResponse[cl_data.ThreadDict]:
        return cl_data.PaginatedResponse(
            data=[t for t in thread_history if t["id"] not in deleted_thread_ids],
            pageInfo=cl_data.PageInfo(hasNextPage=False, endCursor=None),
        )

    async def get_thread(self, thread_id: str):
        return next((t for t in thread_history if t["id"] == thread_id), None)

    async def delete_thread(self, thread_id: str):
        deleted_thread_ids.append(thread_id)


cl_data._data_layer = TestDataLayer()


async def send_count():
    await cl.Message(
        f"Create step counter: {create_step_counter}", disable_feedback=True
    ).send()


@cl.on_chat_start
async def main():
    await cl.Message("Hello, send me a message!", disable_feedback=True).send()
    await send_count()


@cl.on_message
async def handle_message():
    # Wait for queue to be flushed
    await cl.sleep(2)
    await send_count()
    async with cl.Step(root=True, disable_feedback=True) as step:
        step.output = "Thinking..."
    await cl.Message("Ok!").send()
    await send_count()


@cl.password_auth_callback
def auth_callback(username: str, password: str) -> Optional[cl.User]:
    if (username, password) == ("admin", "admin"):
        return cl.User(identifier="admin")
    else:
        return None


@cl.on_chat_resume
async def on_chat_resume(thread: cl_data.ThreadDict):
    await cl.Message(f"Welcome back to {thread['name']}").send()
