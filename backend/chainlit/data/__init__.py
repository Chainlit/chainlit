import functools
import os
from collections import deque
from typing import TYPE_CHECKING, Dict, List, Optional, Union

import aiofiles
from chainlit.config import config
from chainlit.context import context
from chainlit.logger import logger
from chainlit.session import WebsocketSession
from chainlit.types import Feedback, Pagination, ThreadDict, ThreadFilter
from chainlit.user import PersistedUser, User, UserDict
from literalai import Attachment
from literalai import Feedback as ClientFeedback
from literalai import PageInfo, PaginatedResponse
from literalai import Step as ClientStep
from literalai.thread import NumberListFilter, StringFilter, StringListFilter
from literalai.thread import ThreadFilter as ClientThreadFilter

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
                and not context.session.has_first_interaction
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
    ) -> str:
        return ""

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
        self, pagination: "Pagination", filters: "ThreadFilter"
    ) -> "PaginatedResponse[ThreadDict]":
        return PaginatedResponse(
            data=[], pageInfo=PageInfo(hasNextPage=False, endCursor=None)
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        return None

    async def update_thread(
        self,
        thread_id: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        pass

    async def create_user_session(
        self,
        id: str,
        started_at: str,
        anon_user_id: str,
        user_id: Optional[str],
    ) -> Dict:
        return {}

    async def update_user_session(
        self, id: str, is_interactive: bool, ended_at: Optional[str]
    ) -> Dict:
        return {}

    async def delete_user_session(self, id: str) -> bool:
        return True


class ChainlitDataLayer:
    def __init__(self, api_key: str, server: Optional[str]):
        from literalai import LiteralClient

        self.client = LiteralClient(api_key=api_key, url=server)
        logger.info("Chainlit data layer initialized")

    def attachment_to_element_dict(self, attachment: Attachment) -> "ElementDict":
        metadata = attachment.metadata or {}
        return {
            "chainlitKey": None,
            "display": metadata.get("display", "side"),
            "language": metadata.get("language"),
            "page": metadata.get("page"),
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
            "id": feedback.id or "",
            "forId": feedback.step_id or "",
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
            "type": step.type or "undefined",
            "name": step.name or "",
            "generation": step.generation.to_dict() if step.generation else None,
            "input": step.input or "",
            "output": step.output or "",
            "showInput": metadata.get("showInput", False),
            "disableFeedback": metadata.get("disableFeedback", False),
            "indent": metadata.get("indent"),
            "language": metadata.get("language"),
            "isError": metadata.get("isError", False),
            "waitForAnswer": metadata.get("waitForAnswer", False),
            "feedback": self.feedback_to_feedback_dict(step.feedback),
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
        _user = await self.client.api.get_user(identifier=user.identifier)
        if not _user:
            _user = await self.client.api.create_user(
                identifier=user.identifier, metadata=user.metadata
            )
        elif _user.id:
            await self.client.api.update_user(id=_user.id, metadata=user.metadata)
        return PersistedUser(
            id=_user.id or "",
            identifier=_user.identifier or "",
            metadata=_user.metadata,
            createdAt=_user.created_at or "",
        )

    async def upsert_feedback(
        self,
        feedback: Feedback,
    ):
        if feedback.id:
            await self.client.api.update_feedback(
                id=feedback.id,
                update_params={
                    "comment": feedback.comment,
                    "strategy": feedback.strategy,
                    "value": feedback.value,
                },
            )
            return feedback.id
        else:
            created = await self.client.api.create_feedback(
                step_id=feedback.forId,
                value=feedback.value,
                comment=feedback.comment,
                strategy=feedback.strategy,
            )
            return created.id or ""

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        metadata = {
            "size": element.size,
            "language": element.language,
            "display": element.display,
            "type": element.type,
            "page": getattr(element, "page", None),
        }

        if not element.for_id:
            return

        object_key = None

        if not element.url:
            if element.path:
                async with aiofiles.open(element.path, "rb") as f:
                    content = await f.read()  # type: Union[bytes, str]
            elif element.content:
                content = element.content
            else:
                raise ValueError("Either path or content must be provided")
            uploaded = await self.client.api.upload_file(
                content=content, mime=element.mime, thread_id=element.thread_id
            )
            object_key = uploaded["object_key"]

        await self.client.api.send_steps(
            [
                {
                    "id": element.for_id,
                    "threadId": element.thread_id,
                    "attachments": [
                        {
                            "id": element.id,
                            "name": element.name,
                            "metadata": metadata,
                            "mime": element.mime,
                            "url": element.url,
                            "objectKey": object_key,
                        }
                    ],
                }
            ]
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
            "disableFeedback": step_dict.get("disableFeedback"),
            "isError": step_dict.get("isError"),
            "waitForAnswer": step_dict.get("waitForAnswer"),
            "language": step_dict.get("language"),
            "showInput": step_dict.get("showInput"),
        }

        await self.client.api.send_steps(
            [
                {
                    "createdAt": step_dict.get("createdAt"),
                    "startTime": step_dict.get("start"),
                    "endTime": step_dict.get("end"),
                    "generation": step_dict.get("generation"),
                    "id": step_dict.get("id"),
                    "parentId": step_dict.get("parentId"),
                    "input": step_dict.get("input"),
                    "output": step_dict.get("output"),
                    "name": step_dict.get("name"),
                    "threadId": step_dict.get("threadId"),
                    "type": step_dict.get("type"),
                    "metadata": metadata,
                }
            ]
        )

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        await self.create_step(step_dict)

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
        self, pagination: "Pagination", filters: "ThreadFilter"
    ) -> "PaginatedResponse[ThreadDict]":
        if not filters.userIdentifier:
            raise ValueError("userIdentifier is required")

        client_filters = ClientThreadFilter(
            participantsIdentifier=StringListFilter(
                operator="in", value=[filters.userIdentifier]
            ),
        )
        if filters.search:
            client_filters.search = StringFilter(operator="ilike", value=filters.search)
        if filters.feedback:
            client_filters.feedbacksValue = NumberListFilter(
                operator="in", value=[filters.feedback]
            )
        return await self.client.api.list_threads(
            first=pagination.first, after=pagination.cursor, filters=client_filters
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        thread = await self.client.api.get_thread(id=thread_id)
        if not thread:
            return None
        elements = []  # List[ElementDict]
        steps = []  # List[StepDict]
        if thread.steps:
            for step in thread.steps:
                if config.ui.hide_cot and step.parent_id:
                    continue
                for attachment in step.attachments:
                    elements.append(self.attachment_to_element_dict(attachment))
                if not config.features.prompt_playground and step.generation:
                    step.generation = None
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
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        await self.client.api.upsert_thread(
            thread_id=thread_id,
            participant_id=user_id,
            metadata=metadata,
            tags=tags,
        )

    async def create_user_session(
        self,
        id: str,
        started_at: str,
        anon_user_id: str,
        user_id: Optional[str],
    ) -> Dict:
        existing_session = await self.client.api.get_user_session(id=id)
        if existing_session:
            return existing_session
        session = await self.client.api.create_user_session(
            id=id,
            started_at=started_at,
            participant_identifier=user_id,
            anon_participant_identifier=anon_user_id,
        )
        return session

    async def update_user_session(
        self, id: str, is_interactive: bool, ended_at: Optional[str]
    ) -> Dict:
        session = await self.client.api.update_user_session(
            id=id, is_interactive=is_interactive, ended_at=ended_at
        )
        return session

    async def delete_user_session(self, id: str) -> bool:
        await self.client.api.delete_user_session(id=id)
        return True


if api_key := os.environ.get("LITERAL_API_KEY"):
    server = os.environ.get("LITERAL_SERVER")
    _data_layer = ChainlitDataLayer(api_key=api_key, server=server)


def get_data_layer():
    return _data_layer
