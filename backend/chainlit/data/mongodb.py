from chainlit.data import BaseDataLayer, queue_until_user_message
from chainlit.types import Feedback, Pagination, ThreadDict, ThreadFilter
from chainlit.user import PersistedUser, User
from literalai import Attachment, Feedback as _ClientFeedback
from literalai import PageInfo, PaginatedResponse
from literalai import Step as _ClientStep
from pymongo import MongoClient, DESCENDING
from typing import TYPE_CHECKING, Any, Dict, List, Literal, Optional
from datetime import datetime
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


class MongoDataLayer(BaseDataLayer):
    def __init__(self, db_url: str):
        # Connect to the database
        self.client = MongoClient(db_url)  # type: MongoClient
        self.db = self.client.get_database()

        # Get collection references
        self.users_collection = self.db.get_collection("users")
        self.elements_collection = self.db.get_collection("elements")
        self.steps_collection = self.db.get_collection("steps")
        self.threads_collection = self.db.get_collection("threads")

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
        user_data: Dict[str, Any] = {
            "identifier": user.identifier,
            "metadata": user.metadata,
            "createdAt": datetime.utcnow(),
        }
        result = self.users_collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return PersistedUser(**user_data)

    async def upsert_feedback(self, feedback: Feedback):
        feedback_data = {
            "step_id": feedback.forId,
            "value": feedback.value,
            "strategy": feedback.strategy,
            "comment": feedback.comment,
        }
        if feedback.id:
            self.steps_collection.update_one({"_id": feedback.id}, {"$set": {"feedback": feedback_data}})
            return feedback.id
        else:
            result = self.steps_collection.update_one({"_id": feedback.forId}, {"$set": {"feedback": feedback_data}})
            return result.upserted_id or ""

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        # TODO: Support file upload from user
        pass

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
            "createdAt": step_dict.get("createdAt"),
            "id": step_dict.get("id"),
            "threadId": step_dict.get("threadId"),
            "parentId": step_dict.get("parentId"),
            "feedback": step_dict.get("feedback"),
            "start": step_dict.get("start"),
            "end": step_dict.get("end"),
            "type": step_dict.get("type"),
            "name": step_dict.get("name"),
            "generation": step_dict.get("generation"),
            "input": step_dict.get("input"),
            "output": step_dict.get("output"),
            "metadata": metadata,
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

        query: Dict[str, Any] = {"participants.identifier": filters.userIdentifier}
        if filters.search:
            query["$text"] = {"$search": filters.search}
        if filters.feedback:
            query["feedback.value"] = filters.feedback

        sort = [("createdAt", DESCENDING)]
        if pagination.cursor:
            query["_id"] = {"$lt": pagination.cursor}

        threads_data = list(self.threads_collection.find(query).sort(sort).limit(pagination.first))

        threads: List[ThreadDict] = [
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
        end_cursor = threads[-1]["id"] if has_next_page else None

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
            "createdAt": thread_data["createdAt"],
            "id": thread_data["_id"],
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
        update_data: Dict[str, Any] = {}
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
