import os
from typing import Optional, Dict, List

import chainlit as cl
import chainlit.data as cl_data
from chainlit.types import (
    ThreadDict,
    Pagination,
    ThreadFilter,
    PaginatedResponse,
    PageInfo,
    Feedback,
)
from chainlit.utils import utc_now

os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"  # nosec B105

now = utc_now()

# Simple in-memory persistence for threads per user
THREADS: Dict[str, List[ThreadDict]] = {}


class MemoryDataLayer(cl_data.BaseDataLayer):
    async def get_user(self, identifier: str):
        return cl.PersistedUser(id=identifier, createdAt=now, identifier=identifier)

    async def create_user(self, user: cl.User):
        return cl.PersistedUser(
            id=user.identifier, createdAt=now, identifier=user.identifier
        )

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        user_threads = THREADS.setdefault(user_id or "", [])
        thr = next((t for t in user_threads if t["id"] == thread_id), None)
        if not thr:
            thr = {
                "id": thread_id,
                "createdAt": utc_now(),
                "userId": user_id,
                "userIdentifier": user_id,
                "name": name or thread_id,
                "steps": [],
            }
            user_threads.append(thr)
        if name:
            thr["name"] = name
        if metadata is not None:
            thr["metadata"] = metadata
        if tags is not None:
            thr["tags"] = tags

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse[ThreadDict]:
        user_id = filters.userId or ""
        data = THREADS.get(user_id, [])
        return PaginatedResponse(
            data=data,
            pageInfo=PageInfo(hasNextPage=False, startCursor=None, endCursor=None),
        )

    async def get_thread(self, thread_id: str):
        for threads in THREADS.values():
            for t in threads:
                if t["id"] == thread_id:
                    return t
        return None

    async def delete_thread(self, thread_id: str):
        for uid, threads in THREADS.items():
            THREADS[uid] = [t for t in threads if t["id"] != thread_id]

    async def upsert_feedback(self, feedback: Feedback) -> str:
        return ""


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
