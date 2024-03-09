from chainlit.data import BaseDataLayer, queue_until_user_message
from chainlit.types import Feedback, Pagination, ThreadDict, ThreadFilter
from chainlit.user import PersistedUser, User
from chainlit.logger import logger
from literalai import Attachment, Feedback as _ClientFeedback
from literalai import PageInfo, PaginatedResponse
from literalai import Step as _ClientStep
from typing import TYPE_CHECKING, Any, Dict, List, Literal, Optional, Union
from datetime import datetime
import aiofiles
import json


if TYPE_CHECKING:
    from chainlit.element import Element, ElementDict
    from chainlit.step import FeedbackDict as _FeedbackDict, StepDict

    class ClientFeedback(_ClientFeedback):
        """Fix typing for _ClientFeedback"""

        value: Literal[-1, 0, 0]

    class ClientStep(_ClientStep):
        """Fix typing for _ClientStep"""

        feedback: Optional[ClientFeedback]

    class FeedbackDict(_FeedbackDict):
        """Augment typing for _FeedbackDict"""

        id: str
        forId: str


class MongoDBDataLayer(BaseDataLayer):
    def __init__(self, db_url: str):
        from pymongo import MongoClient

        # Connect to the database
        self.client = MongoClient(db_url)  # type: MongoClient
        self.db = self.client.get_database()

        # Get collection references
        self.users_collection = self.db.get_collection("users")
        self.elements_collection = self.db.get_collection("elements")
        self.steps_collection = self.db.get_collection("steps")
        self.threads_collection = self.db.get_collection("threads")
        logger.info("MongoDB data layer initialized")

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

    def feedback_to_feedback_dict(self, feedback: Optional[ClientFeedback]) -> "Optional[FeedbackDict]":
        if not feedback:
            return None
        return {
            "id": feedback.id or "",
            "forId": feedback.step_id or "",
            "value": feedback.value or 0,
            "comment": feedback.comment,
            "strategy": "BINARY",
        }

    def step_to_step_dict(self, step: ClientStep) -> "StepDict":
        metadata = step.metadata or {}
        input = (step.input or {}).get("content") or (json.dumps(step.input) if step.input and step.input != {} else "")
        output = (step.output or {}).get("content") or (
            json.dumps(step.output) if step.output and step.output != {} else ""
        )
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
            "input": input,
            "output": output,
            "showInput": metadata.get("showInput", False),
            "disableFeedback": metadata.get("disableFeedback", False),
            "indent": metadata.get("indent"),
            "language": metadata.get("language"),
            "isError": metadata.get("isError", False),
            "waitForAnswer": metadata.get("waitForAnswer", False),
        }

    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        user_data = self.users_collection.find_one({"identifier": identifier})
        if user_data:
            return PersistedUser(
                id=user_data["_id"],
                identifier=user_data["identifier"],
                metadata=user_data.get("metadata", {}),
                createdAt=user_data.get("createdAt"),
            )
        return None

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        _user = await self.get_user(user.identifier)
        if not _user:
            user_data: Dict[str, Any] = {
                "identifier": user.identifier,
                "metadata": user.metadata,
                "createdAt": datetime.utcnow(),
            }
            result = self.users_collection.insert_one(user_data)
            user_data["_id"] = result.inserted_id
            return PersistedUser(**user_data)

        return PersistedUser(
            id=_user.id or "",
            identifier=_user.identifier or "",
            metadata=_user.metadata,
            createdAt=_user.created_at or "",
        )

    async def upsert_feedback(self, feedback: Feedback):
        feedback_data = {
            "id": feedback.id,
            "stepId": feedback.forId,
            "value": feedback.value,
            "strategy": feedback.strategy,
            "comment": feedback.comment,
        }
        self.steps_collection.update_one({"_id": feedback.id}, {"$set": {"feedback": feedback_data}})
        return feedback.id

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

        element_data = {
            "id": element.id,
            "threadId": element.thread_id,
            "stepId": element.for_id,
            "type": element.type,
            "url": element.url,
            "chainlitKey": element.chainlit_key,
            "name": element.name,
            "display": element.display,
            "objectKey": object_key,
            "size": element.size,
            "page": element.page,
            "language": element.language,
            "mime": element.mime,
            "metadata": metadata,
        }
        self.elements_collection.insert_one(element_data)

    async def get_element(self, thread_id: str, element_id: str) -> Optional["ElementDict"]:
        element_data = self.elements_collection.find_one({"id": element_id})
        if not element_data:
            return None
        return element_data

    @queue_until_user_message()
    async def delete_element(self, element_id: str):
        self.elements_collection.delete_one({"id": element_id})

    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        metadata = {
            "disableFeedback": step_dict.get("disableFeedback"),
            "isError": step_dict.get("isError"),
            "waitForAnswer": step_dict.get("waitForAnswer"),
            "language": step_dict.get("language"),
            "showInput": step_dict.get("showInput"),
        }

        step_data = {
            "id": step_dict.get("id"),
            "threadId": step_dict.get("threadId"),
            "parentId": step_dict.get("parentId"),
            "name": step_dict.get("name"),
            "type": step_dict.get("type"),
            "input": step_dict.get("input"),
            "output": step_dict.get("output"),
            "createdAt": step_dict.get("createdAt"),
            "startTime": step_dict.get("start"),
            "endTime": step_dict.get("end"),
            "generation": step_dict.get("generation"),
            "metadata": metadata,
            "feedback": step_dict.get("feedback"),
            "attachments": step_dict.get("attachments"),
        }

        self.steps_collection.insert_one(step_data)

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        self.steps_collection.update_one({"_id": step_dict["id"]}, {"$set": step_dict})

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        self.steps_collection.delete_one({"_id": step_id})

    async def get_thread_author(self, thread_id: str) -> str:
        thread = self.threads_collection.find_one({"_id": thread_id})
        if not thread:
            return ""
        user = thread.get("user")
        if not user:
            return ""
        return user.get("identifier") or ""

    async def delete_thread(self, thread_id: str):
        self.threads_collection.delete_one({"_id": thread_id})
        self.steps_collection.delete_many({"threadId": thread_id})
        self.elements_collection.delete_many({"threadId": thread_id})

    async def list_threads(self, pagination: Pagination, filters: ThreadFilter) -> PaginatedResponse[ThreadDict]:
        if not filters.userIdentifier:
            raise ValueError("userIdentifier is required")

        query = {"participants.identifier": filters.userIdentifier}
        if filters.search:
            query["$text"] = {"$search": filters.search}
        if filters.feedback:
            query["feedback.value"] = filters.feedback

        sort = [("createdAt", DESCENDING)]
        if pagination.cursor:
            query["_id"] = {"$lt": pagination.cursor}

        threads_data = list(self.threads_collection.find(query).sort(sort).limit(pagination.first))

        threads = [
            {
                "id": thread["_id"],
                "createdAt": thread["createdAt"],
                "name": thread.get("name"),
                "user": thread.get("user"),
                "tags": thread.get("tags"),
                "metadata": thread.get("metadata"),
                "steps": list(self.steps_collection.find({"threadId": thread["_id"]})),
                "elements": list(self.elements_collection.find({"threadId": thread["_id"]})),
            }
            for thread in threads_data
        ]

        has_next_page = len(threads) == pagination.first
        end_cursor = threads[-1]["_id"] if has_next_page else None

        return PaginatedResponse(
            data=threads,
            pageInfo=PageInfo(hasNextPage=has_next_page, endCursor=end_cursor),
        )

    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        thread_data = self.threads_collection.find_one({"_id": thread_id})
        if not thread_data:
            return None

        elements = list(self.elements_collection.find({"threadId": thread_data["_id"]}))
        steps = list(self.steps_collection.find({"threadId": thread_data["_id"]}))

        return {
            "id": thread_data["_id"],
            "createdAt": thread_data["createdAt"],
            "name": thread_data.get("name"),
            "steps": [self.step_to_step_dict(step) for step in steps],
            "elements": [self.attachment_to_element_dict(element) for element in elements],
            "metadata": thread_data.get("metadata"),
            "user": thread_data.get("user"),
            "tags": thread_data.get("tags"),
        }

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if user_id is not None:
            update_data["user"] = {"identifier": user_id}
        if metadata is not None:
            update_data["metadata"] = metadata
        if tags is not None:
            update_data["tags"] = tags

        self.threads_collection.update_one({"_id": thread_id}, {"$set": update_data})

    async def delete_user_session(self, id: str) -> bool:
        result = self.threads_collection.delete_many({"metadata.id": id})
        return result.deleted_count > 0
