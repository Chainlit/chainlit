import os
from typing import Optional, Union, Dict, List, TypedDict, TYPE_CHECKING

from chainlit.config import config

from chainlit.types import (
    Pagination,
    PageInfo,
    PaginatedResponse,
    ThreadFilter,
    ThreadDict,
)


if TYPE_CHECKING:
    from chainlit.user import AppUser, PersistedAppUser
    from chainlit.element import ElementDict
    from chainlit.message import MessageDict
    from chainlit.step import StepDict

_data_layer = None


class UploadElementResponse(TypedDict):
    object_key: Optional[str]
    url: Optional[str]


class BaseDataLayer:
    """Base class for data persistence."""

    async def get_user(self, identifier: str) -> Optional["PersistedAppUser"]:
        return None

    async def create_user(self, user: "AppUser") -> Optional["PersistedAppUser"]:
        pass

    async def upsert_feedback(
        self,
        message_id: str,
        feedback: int,
        feedbackComment: Optional[str],
        feedback_id: Optional[str],
    ):
        pass

    async def upload_element(
        self, thread_id: str, content: Union[bytes, str], mime: str
    ) -> UploadElementResponse:
        return {"object_key": None, "url": None}

    async def create_element(self, element_dict: "ElementDict"):
        pass

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional["ElementDict"]:
        pass

    async def delete_element(self, element_id: str):
        pass

    async def create_message(self, message_dict: "MessageDict"):
        pass

    async def update_message(self, message_dict: "MessageDict"):
        pass

    async def delete_message(self, message_id: str):
        pass

    async def create_step(self, step_dict: "StepDict"):
        pass

    async def update_step(self, step_dict: "StepDict"):
        pass

    async def delete_step(self, step_id: str):
        pass

    async def get_thread_author(self, thread_id: str) -> str:
        return ""

    async def delete_thread(self, thread_id: str):
        pass

    async def list_threads(
        self, pagination: "Pagination", filter: "ThreadFilter"
    ) -> "PaginatedResponse[ThreadDict]":
        return PaginatedResponse(
            data=[], pageInfo=PageInfo(hasNextPage=False, endCursor=None)
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        return None

    async def update_thread(
        self, thread_id: str, metadata: Optional[Dict], tags: Optional[List[str]]
    ):
        pass


def get_data_layer():
    global _data_layer
    if _data_layer is None:
        if config.data_persistence:
            _data_layer = BaseDataLayer()

    return _data_layer
