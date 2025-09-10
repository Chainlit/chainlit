import os
from typing import Optional, Dict, List, Any

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
    """Minimal in-memory data layer implementing the required abstract methods
    for the sharing e2e tests. Only the subset of functionality exercised by the
    tests is implemented. Elements/steps are stored inside the thread dict.
    """
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

    # --- Steps & Elements -------------------------------------------------

    async def create_step(self, step_dict: Dict[str, Any]):  # type: ignore[override]
        """Append a step to its thread."""
        thread_id = step_dict.get("threadId") or step_dict.get("thread_id")
        if not thread_id:
            return
        thr = await self.get_thread(thread_id)
        if not thr:
            # Create a placeholder thread if missing (unlikely in tests)
            await self.update_thread(thread_id, user_id=step_dict.get("userId"))
            thr = await self.get_thread(thread_id)
        if thr is None:
            return
        steps = thr.setdefault("steps", [])
        # replace if existing id
        for i, s in enumerate(steps):
            if s.get("id") == step_dict.get("id"):
                steps[i] = step_dict
                break
        else:
            steps.append(step_dict)

    async def update_step(self, step_dict: Dict[str, Any]):  # type: ignore[override]
        await self.create_step(step_dict)

    async def delete_step(self, step_id: str):  # type: ignore[override]
        for threads in THREADS.values():
            for t in threads:
                steps = t.get("steps") or []
                t["steps"] = [s for s in steps if s.get("id") != step_id]

    # --- Elements ----------------------------------------------------------

    async def create_element(self, element):  # type: ignore[override]
        thread_id = getattr(element, "thread_id", None) or getattr(
            element, "threadId", None
        )
        if not thread_id:
            return
        thr = await self.get_thread(thread_id)
        if not thr:
            await self.update_thread(thread_id)
            thr = await self.get_thread(thread_id)
        if thr is None:
            return
        elements = thr.setdefault("elements", [])
        # store a dict representation (id + metadata we need)
        edict = getattr(element, "to_dict", lambda: {"id": element.id})()
        for i, e in enumerate(elements):
            if e.get("id") == edict.get("id"):
                elements[i] = edict
                break
        else:
            elements.append(edict)

    async def get_element(self, thread_id: str, element_id: str):  # type: ignore[override]
        thr = await self.get_thread(thread_id)
        if not thr:
            return None
        for e in thr.get("elements", []) or []:
            if e.get("id") == element_id:
                return e
        return None

    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):  # type: ignore[override]
        if thread_id:
            thr = await self.get_thread(thread_id)
            if thr:
                thr["elements"] = [
                    e for e in thr.get("elements", []) if e.get("id") != element_id
                ]
            return
        for threads in THREADS.values():
            for t in threads:
                t["elements"] = [
                    e for e in t.get("elements", []) if e.get("id") != element_id
                ]

    # --- Feedback ----------------------------------------------------------

    async def delete_feedback(self, feedback_id: str) -> bool:  # type: ignore[override]
        # Not needed for tests
        return True

    # --- Thread helpers ----------------------------------------------------

    async def get_thread_author(self, thread_id: str) -> str:  # type: ignore[override]
        thr = await self.get_thread(thread_id)
        return thr.get("userId") if thr else ""

    async def build_debug_url(self) -> str:  # type: ignore[override]
        return ""

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
