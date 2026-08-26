import os
from typing import Dict, List, Optional

import chainlit as cl
import chainlit.data as cl_data
from chainlit.data.utils import queue_until_user_message
from chainlit.element import Element, ElementDict
from chainlit.step import StepDict
from chainlit.types import (
    Feedback,
    PageInfo,
    PaginatedResponse,
    Pagination,
    ThreadDict,
    ThreadFilter,
)
from chainlit.utils import utc_now

os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"  # nosec B105

now = utc_now()

# Simple in-memory persistence for threads per user
THREADS: Dict[str, List[ThreadDict]] = {}


def find_thread(thread_id: str) -> Optional[ThreadDict]:
    """Return the stored thread with this id, whichever user bucket holds it."""
    for threads in THREADS.values():
        for thread in threads:
            if thread["id"] == thread_id:
                return thread
    return None


def ensure_thread(thread_id: str, user_id: Optional[str] = None) -> ThreadDict:
    """Return the stored thread with this id, creating the row if needed.

    Steps can be persisted before the first `update_thread` call, so a row may
    have to be created without an owner. Re-home it when the owner shows up
    instead of appending a second, empty row under the user.
    """
    thread = find_thread(thread_id)
    if thread is None:
        thread = {
            "id": thread_id,
            "createdAt": utc_now(),
            "userId": user_id,
            "userIdentifier": user_id,
            "name": thread_id,
            "steps": [],
        }
        THREADS.setdefault(user_id or "", []).append(thread)
    elif user_id and thread.get("userIdentifier") != user_id:
        for uid, threads in THREADS.items():
            THREADS[uid] = [t for t in threads if t is not thread]
        thread["userId"] = user_id
        thread["userIdentifier"] = user_id
        THREADS.setdefault(user_id, []).append(thread)
    return thread


class MemoryDataLayer(cl_data.BaseDataLayer):
    async def get_user(self, identifier: str):
        return cl.PersistedUser(id=identifier, createdAt=now, identifier=identifier)

    async def create_user(self, user: cl.User):
        return cl.PersistedUser(
            id=user.identifier, createdAt=now, identifier=user.identifier
        )

    async def delete_feedback(
        self,
        feedback_id: str,
    ) -> bool:
        pass

    async def upsert_feedback(
        self,
        feedback: Feedback,
    ) -> str:
        pass

    async def create_element(self, element: "Element"):
        pass

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional["ElementDict"]:
        pass

    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        pass

    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        thread_id = step_dict.get("threadId")
        if not thread_id:
            return
        steps = ensure_thread(thread_id)["steps"]
        for index, existing in enumerate(steps):
            if existing["id"] == step_dict["id"]:
                steps[index] = step_dict
                return
        steps.append(step_dict)

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        await self.create_step(step_dict)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        for thread in (t for threads in THREADS.values() for t in threads):
            thread["steps"] = [s for s in thread["steps"] if s["id"] != step_id]

    async def get_thread_author(self, thread_id: str) -> str:
        return (await self.get_thread(thread_id))["userIdentifier"]

    async def delete_thread(self, thread_id: str):
        for uid, threads in THREADS.items():
            THREADS[uid] = [t for t in threads if t["id"] != thread_id]

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse[ThreadDict]:
        user_id = filters.userId or ""
        data = THREADS.get(user_id, [])
        return PaginatedResponse(
            data=data,
            pageInfo=PageInfo(hasNextPage=False, startCursor=None, endCursor=None),
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        for threads in THREADS.values():
            for t in threads:
                if t["id"] == thread_id:
                    return t
        return None

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        thr = ensure_thread(thread_id, user_id)
        if name:
            thr["name"] = name
        if metadata is not None:
            thr["metadata"] = metadata
        if tags is not None:
            thr["tags"] = tags

    async def get_favorite_steps(self, user_id: str) -> List["StepDict"]:
        return []

    async def build_debug_url(self) -> str:
        pass

    async def close(self) -> None:
        pass


@cl.data_layer
def data_layer():
    return MemoryDataLayer()


@cl.password_auth_callback
def auth(username: str, password: str) -> Optional[cl.User]:
    if (username, password) in [("alice", "a"), ("bob", "b")]:
        return cl.PersistedUser(id=username, createdAt=now, identifier=username)
    return None


@cl.on_chat_start
async def start():
    await cl.Message("Welcome, say hi to start!").send()


@cl.on_chat_resume
async def on_resume(thread: ThreadDict):
    await cl.Message(f"Resumed: {thread['name']}").send()


@cl.on_message
async def on_message(msg: cl.Message):
    await cl.Message(f"Echo: {msg.content}").send()
