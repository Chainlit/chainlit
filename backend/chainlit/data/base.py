import functools
from collections import deque
from typing import TYPE_CHECKING, Dict, List, Optional

from chainlit.context import context
from chainlit.session import WebsocketSession
from chainlit.types import Feedback, Pagination, ThreadDict, ThreadFilter
from chainlit.user import PersistedUser, User
from literalai import PageInfo, PaginatedResponse

if TYPE_CHECKING:
    from chainlit.element import ElementDict
    from chainlit.step import StepDict


def queue_until_user_message():
    def decorator(method):
        @functools.wraps(method)
        async def wrapper(self, *args, **kwargs):
            if isinstance(context.session, WebsocketSession) and not context.session.has_first_interaction:
                # Queue the method invocation waiting for the first user message
                queues = context.session.thread_queues
                method_name = method.__name__
                if method_name not in queues:
                    queues[method_name] = deque()
                queues[method_name].append((method, self, args, kwargs))

            else:
                # Otherwise, Execute the method immediately
                return await method(self, *args, **kwargs)

        return wrapper

    return decorator


class BaseDataLayer:
    """Base class for data persistence."""

    async def get_user(self, identifier: str) -> Optional["PersistedUser"]:
        return None

    async def create_user(self, user: "User") -> Optional["PersistedUser"]:
        pass

    async def upsert_feedback(
        self,
        feedback: Feedback,
    ) -> str:
        return ""

    @queue_until_user_message()
    async def create_element(self, element_dict: "ElementDict"):
        pass

    async def get_element(self, thread_id: str, element_id: str) -> Optional["ElementDict"]:
        pass

    @queue_until_user_message()
    async def delete_element(self, element_id: str):
        pass

    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        pass

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        pass

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        pass

    async def get_thread_author(self, thread_id: str) -> str:
        return ""

    async def delete_thread(self, thread_id: str):
        pass

    async def list_threads(self, pagination: "Pagination", filters: "ThreadFilter") -> "PaginatedResponse[ThreadDict]":
        return PaginatedResponse(data=[], pageInfo=PageInfo(hasNextPage=False, endCursor=None))

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        return None

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        pass

    async def delete_user_session(self, id: str) -> bool:
        return True
