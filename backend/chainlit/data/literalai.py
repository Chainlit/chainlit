import json
from typing import TYPE_CHECKING, Dict, List, Literal, Optional, Union, cast

import aiofiles
from chainlit.data.base import BaseDataLayer
from chainlit.data.utils import queue_until_user_message
from chainlit.logger import logger
from chainlit.types import (
    Feedback,
    PageInfo,
    PaginatedResponse,
    Pagination,
    ThreadDict,
    ThreadFilter,
)
from chainlit.user import PersistedUser, User
from httpx import HTTPStatusError, RequestError
from literalai import Attachment
from literalai import Score as LiteralScore
from literalai import Step as LiteralStep
from literalai.filter import threads_filters as LiteralThreadsFilters
from literalai.step import StepDict as LiteralStepDict

if TYPE_CHECKING:
    from chainlit.element import Element, ElementDict
    from chainlit.step import FeedbackDict, StepDict


_data_layer: Optional[BaseDataLayer] = None


class LiteralDataLayer(BaseDataLayer):
    def __init__(self, api_key: str, server: Optional[str]):
        from literalai import AsyncLiteralClient

        self.client = AsyncLiteralClient(api_key=api_key, url=server)
        logger.info("Chainlit data layer initialized")

    def attachment_to_element_dict(self, attachment: Attachment) -> "ElementDict":
        metadata = attachment.metadata or {}
        return {
            "chainlitKey": None,
            "display": metadata.get("display", "side"),
            "language": metadata.get("language"),
            "autoPlay": metadata.get("autoPlay", None),
            "playerConfig": metadata.get("playerConfig", None),
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

    def score_to_feedback_dict(
        self, score: Optional[LiteralScore]
    ) -> "Optional[FeedbackDict]":
        if not score:
            return None
        return {
            "id": score.id or "",
            "forId": score.step_id or "",
            "value": cast(Literal[0, 1], score.value),
            "comment": score.comment,
        }

    def step_to_step_dict(self, step: LiteralStep) -> "StepDict":
        metadata = step.metadata or {}
        input = (step.input or {}).get("content") or (
            json.dumps(step.input) if step.input and step.input != {} else ""
        )
        output = (step.output or {}).get("content") or (
            json.dumps(step.output) if step.output and step.output != {} else ""
        )

        user_feedback = (
            next(
                (
                    s
                    for s in step.scores
                    if s.type == "HUMAN" and s.name == "user-feedback"
                ),
                None,
            )
            if step.scores
            else None
        )

        return {
            "createdAt": step.created_at,
            "id": step.id or "",
            "threadId": step.thread_id or "",
            "parentId": step.parent_id,
            "feedback": self.score_to_feedback_dict(user_feedback),
            "start": step.start_time,
            "end": step.end_time,
            "type": step.type or "undefined",
            "name": step.name or "",
            "generation": step.generation.to_dict() if step.generation else None,
            "input": input,
            "output": output,
            "showInput": metadata.get("showInput", False),
            "indent": metadata.get("indent"),
            "language": metadata.get("language"),
            "isError": bool(step.error),
            "waitForAnswer": metadata.get("waitForAnswer", False),
        }

    async def build_debug_url(self) -> str:
        try:
            project_id = await self.client.api.get_my_project_id()
            return f"{self.client.api.url}/projects/{project_id}/logs/threads/[thread_id]?currentStepId=[step_id]"
        except Exception as e:
            logger.error(f"Error building debug url: {e}")
            return ""

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
            metadata=user.metadata,
            createdAt=_user.created_at or "",
        )

    async def delete_feedback(
        self,
        feedback_id: str,
    ):
        if feedback_id:
            await self.client.api.delete_score(
                id=feedback_id,
            )
            return True
        return False

    async def upsert_feedback(
        self,
        feedback: Feedback,
    ):
        if feedback.id:
            await self.client.api.update_score(
                id=feedback.id,
                update_params={
                    "comment": feedback.comment,
                    "value": feedback.value,
                },
            )
            return feedback.id
        else:
            created = await self.client.api.create_score(
                step_id=feedback.forId,
                value=feedback.value,
                comment=feedback.comment,
                name="user-feedback",
                type="HUMAN",
            )
            return created.id or ""

    async def safely_send_steps(self, steps):
        try:
            await self.client.api.send_steps(steps)
        except HTTPStatusError as e:
            logger.error(f"HTTP Request: error sending steps: {e.response.status_code}")
        except RequestError as e:
            logger.error(f"HTTP Request: error for {e.request.url!r}.")

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
                    content: Union[bytes, str] = await f.read()
            elif element.content:
                content = element.content
            else:
                raise ValueError("Either path or content must be provided")
            uploaded = await self.client.api.upload_file(
                content=content, mime=element.mime, thread_id=element.thread_id
            )
            object_key = uploaded["object_key"]

        await self.safely_send_steps(
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
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        await self.client.api.delete_attachment(id=element_id)

    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        metadata = dict(
            step_dict.get("metadata", {}),
            **{
                "waitForAnswer": step_dict.get("waitForAnswer"),
                "language": step_dict.get("language"),
                "showInput": step_dict.get("showInput"),
            },
        )

        step: LiteralStepDict = {
            "createdAt": step_dict.get("createdAt"),
            "startTime": step_dict.get("start"),
            "endTime": step_dict.get("end"),
            "generation": step_dict.get("generation"),
            "id": step_dict.get("id"),
            "parentId": step_dict.get("parentId"),
            "name": step_dict.get("name"),
            "threadId": step_dict.get("threadId"),
            "type": step_dict.get("type"),
            "tags": step_dict.get("tags"),
            "metadata": metadata,
        }
        if step_dict.get("input"):
            step["input"] = {"content": step_dict.get("input")}
        if step_dict.get("output"):
            step["output"] = {"content": step_dict.get("output")}
        if step_dict.get("isError"):
            step["error"] = step_dict.get("output")

        await self.safely_send_steps([step])

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
        user_identifier = thread.get("userIdentifier")
        if not user_identifier:
            return ""

        return user_identifier

    async def delete_thread(self, thread_id: str):
        await self.client.api.delete_thread(id=thread_id)

    async def list_threads(
        self, pagination: "Pagination", filters: "ThreadFilter"
    ) -> "PaginatedResponse[ThreadDict]":
        if not filters.userId:
            raise ValueError("userId is required")

        literal_filters: LiteralThreadsFilters = [
            {
                "field": "participantId",
                "operator": "eq",
                "value": filters.userId,
            }
        ]

        if filters.search:
            literal_filters.append(
                {
                    "field": "stepOutput",
                    "operator": "ilike",
                    "value": filters.search,
                    "path": "content",
                }
            )

        if filters.feedback is not None:
            literal_filters.append(
                {
                    "field": "scoreValue",
                    "operator": "eq",
                    "value": filters.feedback,
                    "path": "user-feedback",
                }
            )

        literal_response = await self.client.api.list_threads(
            first=pagination.first,
            after=pagination.cursor,
            filters=literal_filters,
            order_by={"column": "createdAt", "direction": "DESC"},
        )
        return PaginatedResponse(
            pageInfo=PageInfo(
                hasNextPage=literal_response.pageInfo.hasNextPage,
                startCursor=literal_response.pageInfo.startCursor,
                endCursor=literal_response.pageInfo.endCursor,
            ),
            data=literal_response.data,
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        from chainlit.step import check_add_step_in_cot, stub_step

        thread = await self.client.api.get_thread(id=thread_id)
        if not thread:
            return None
        elements = []  # List[ElementDict]
        steps = []  # List[StepDict]
        if thread.steps:
            for step in thread.steps:
                for attachment in step.attachments:
                    elements.append(self.attachment_to_element_dict(attachment))

                if check_add_step_in_cot(step):
                    steps.append(self.step_to_step_dict(step))
                else:
                    steps.append(stub_step(step))

        return {
            "createdAt": thread.created_at or "",
            "id": thread.id,
            "name": thread.name or None,
            "steps": steps,
            "elements": elements,
            "metadata": thread.metadata,
            "userId": thread.participant_id,
            "userIdentifier": thread.participant_identifier,
            "tags": thread.tags,
        }

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        await self.client.api.upsert_thread(
            id=thread_id,
            name=name,
            participant_id=user_id,
            metadata=metadata,
            tags=tags,
        )
