import functools
import os
from collections import deque
from typing import TYPE_CHECKING, Dict, List, Optional

from chainlit.context import context
from chainlit.session import WebsocketSession
from chainlit.types import Feedback, Pagination, ThreadDict, ThreadFilter
from chainlit.user import PersistedUser, User, UserDict
from chainlit_client import Attachment
from chainlit_client import Feedback as ClientFeedback
from chainlit_client import PageInfo, PaginatedResponse
from chainlit_client import Step as ClientStep

if TYPE_CHECKING:
    from chainlit.element import Element, ElementDict
    from chainlit.step import FeedbackDict, StepDict

_data_layer = None


def queue_until_user_message():
    def decorator(method):
        @functools.wraps(method)
        async def wrapper(self, *args, **kwargs):
            if (
                isinstance(context.session, WebsocketSession)
                and not context.session.has_user_message
            ):
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
    ):
        pass

    @queue_until_user_message()
    async def create_element(self, element_dict: "ElementDict"):
        pass

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional["ElementDict"]:
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

    async def list_threads(
        self, pagination: "Pagination", filter: "ThreadFilter"
    ) -> "PaginatedResponse[ThreadDict]":
        return PaginatedResponse(
            data=[], pageInfo=PageInfo(hasNextPage=False, endCursor=None)
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        return None

    async def update_thread(
        self,
        thread_id: str,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        pass


class ChainlitDataLayer:
    def __init__(
        self, api_key: str, chainlit_server: Optional[str] = "https://cloud.chainlit.io"
    ):
        from chainlit_client import ChainlitClient

        self.client = ChainlitClient(api_key=api_key, endpoint=chainlit_server)

    def attachment_to_element_dict(self, attachment: Attachment) -> "ElementDict":
        metadata = attachment.metadata or {}
        return {
            "chainlitKey": None,
            "display": metadata.get("display", "side"),
            "language": metadata.get("language"),
            "size": metadata.get("size"),
            "type": metadata.get("type", "file"),
            "forId": attachment.step_id,
            "id": attachment.id or "",
            "mime": attachment.mime,
            "name": attachment.name or "",
            "objectKey": attachment.object_key,
            "url": attachment.url,
            "threadId": attachment.thread_id,
        }

    def feedback_to_feedback_dict(
        self, feedback: Optional[ClientFeedback]
    ) -> "Optional[FeedbackDict]":
        if not feedback:
            return None
        return {
            "value": feedback.value or 0,  # type: ignore
            "comment": feedback.comment,
            "strategy": "BINARY",
        }

    def step_to_step_dict(self, step: ClientStep) -> "StepDict":
        metadata = step.metadata or {}
        return {
            "createdAt": step.created_at,
            "id": step.id or "",
            "threadId": step.thread_id or "",
            "parentId": step.parent_id,
            "feedback": self.feedback_to_feedback_dict(step.feedback),
            "start": step.start_time,
            "end": step.end_time,
            "type": step.type or "UNDEFINED",
            "name": step.name or "",
            "generation": step.generation.to_dict() if step.generation else None,
            "input": step.input or "",
            "output": step.output or "",
            "disableFeedback": metadata.get("disableFeedback", False),
            "indent": metadata.get("indent"),
            "language": metadata.get("language"),
            "isError": metadata.get("isError", False),
            "waitForAnswer": metadata.get("waitForAnswer", False),
        }

    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        user = await self.client.api.get_user(identifier=identifier)
        if not user:
            return None
        return PersistedUser(
            id=user.id or "",
            identifier=user.identifier or "",
            metadata=user.metadata,
            createdAt=user.created_at or "",
        )

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        created_user = await self.client.api.create_user(
            identifier=user.identifier, metadata=user.metadata
        )
        return PersistedUser(
            id=created_user.id or "",
            identifier=created_user.identifier or "",
            metadata=created_user.metadata,
            createdAt=created_user.created_at or "",
        )

    async def upsert_feedback(
        self,
        feedback: Feedback,
    ):
        if feedback.id:
            await self.client.api.update_feedback(
                id=feedback.id,
                value=feedback.value,
                comment=feedback.comment,
                strategy=feedback.strategy,
            )
        else:
            await self.client.api.create_feedback(
                step_id=feedback.forId,
                value=feedback.value,
                comment=feedback.comment,
                strategy=feedback.strategy,
            )

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        metadata = {
            "size": element.size,
            "language": element.language,
            "display": element.display,
            "type": element.type,
        }
        attachment = Attachment(
            thread_id=element.thread_id,
            step_id=element.for_id or "",
            name=element.name,
            mime=element.mime,
            url=element.url,
            metadata=metadata,
        )
        await self.client.api.create_attachment(
            attachment=attachment, content=element.content, path=element.path
        )

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional["ElementDict"]:
        attachment = await self.client.api.get_attachment(id=element_id)
        if not attachment:
            return None
        return self.attachment_to_element_dict(attachment)

    @queue_until_user_message()
    async def delete_element(self, element_id: str):
        await self.client.api.delete_attachment(id=element_id)

    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        metadata = {
            "disableFeedback": step_dict["disableFeedback"],
            "isError": step_dict["isError"],
            "waitForAnswer": step_dict["waitForAnswer"],
            "language": step_dict["language"],
        }

        await self.client.api.send_steps(
            [
                {
                    "startTime": step_dict["start"],
                    "endTime": step_dict["end"],
                    "generation": step_dict["generation"],
                    "id": step_dict["id"],
                    "parentId": step_dict["parentId"],
                    "input": step_dict["input"],
                    "output": step_dict["output"],
                    "name": step_dict["name"],
                    "threadId": step_dict["threadId"],
                    "type": step_dict["type"],
                    "metadata": metadata,
                }
            ]
        )

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        metadata = {
            "disableFeedback": step_dict["disableFeedback"],
            "isError": step_dict["isError"],
            "waitForAnswer": step_dict["waitForAnswer"],
            "language": step_dict["language"],
        }

        await self.client.api.update_step(
            id=step_dict["id"],
            type=step_dict["type"],
            start_time=step_dict["start"],
            end_time=step_dict["end"],
            input=step_dict["input"],
            output=step_dict["output"],
            parent_id=step_dict["parentId"],
            name=step_dict["name"],
            generation=step_dict["generation"],
            metadata=metadata,
        )

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        await self.client.api.delete_step(id=step_id)

    async def get_thread_author(self, thread_id: str) -> str:
        thread = await self.get_thread(thread_id)
        if not thread:
            return ""
        user = thread.get("user")
        if not user:
            return ""
        return user.get("identifier") or ""

    async def delete_thread(self, thread_id: str):
        await self.client.api.delete_thread(id=thread_id)

    async def list_threads(
        self, pagination: "Pagination", filter: "ThreadFilter"
    ) -> "PaginatedResponse[ThreadDict]":
        # TODO
        # await self.client.api.list_threads(first=pagination.first, skip=pagination.cursor)
        return PaginatedResponse(
            data=[], pageInfo=PageInfo(hasNextPage=False, endCursor=None)
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        thread = await self.client.api.get_thread(id=thread_id)
        if not thread:
            return None
        elements = []  # List[ElementDict]
        steps = []  # List[StepDict]
        if thread.steps:
            for step in thread.steps:
                for attachment in step.attachments:
                    elements.append(self.attachment_to_element_dict(attachment))
                steps.append(self.step_to_step_dict(step))

        user = None  # type: Optional["UserDict"]

        if thread.user:
            user = {
                "id": thread.user.id or "",
                "identifier": thread.user.identifier or "",
                "metadata": thread.user.metadata,
            }

        return {
            "createdAt": thread.created_at or "",
            "id": thread.id,
            "steps": steps,
            "elements": elements,
            "metadata": thread.metadata,
            "user": user,
            "tags": thread.tags,
        }

    async def update_thread(
        self,
        thread_id: str,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        await self.client.api.update_thread(id=thread_id, metadata=metadata, tags=tags)


if api_key := os.environ.get("CHAINLIT_API_KEY"):
    chainlit_server = os.environ.get("CHAINLIT_SERVER")
    _data_layer = ChainlitDataLayer(api_key=api_key, chainlit_server=chainlit_server)


def get_data_layer():
    return _data_layer
