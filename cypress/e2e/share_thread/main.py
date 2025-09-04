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

# In-memory per-user persistence (sufficient for e2e)
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
            md = thr.get("metadata") or {}
            if isinstance(md, dict):
                md.update(metadata)
                thr["metadata"] = md
            else:
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
    # simple two-user login
    if (username, password) in [("a", "a"), ("b", "b")]:
        return cl.User(identifier=username)
    return None


@cl.on_shared_thread_view
async def can_view_shared(
    thread: ThreadDict, viewer: Optional[cl.User], share_token: Optional[str]
):
    md = thread.get("metadata") or {}
    if isinstance(md, dict) and md.get("is_shared") is True:
        return True
    return False


@cl.on_chat_start
async def start():
    await cl.Message("Hello").send()


@cl.on_message
async def on_message(msg: cl.Message):
    await cl.Message(f"You said: {msg.content}").send()
