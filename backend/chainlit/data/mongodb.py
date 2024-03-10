from dataclasses import asdict
import json
import os
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
import asyncio

import aiofiles
from chainlit.config import config
from chainlit.context import context
from chainlit.logger import logger
from chainlit.session import WebsocketSession
from chainlit.types import Feedback, Pagination, ThreadDict, ThreadFilter
from chainlit.user import PersistedUser, User, UserDict
from chainlit.data import BaseDataLayer, queue_until_user_message
from literalai import Attachment
from literalai import Feedback as ClientFeedback
from literalai import PageInfo, PaginatedResponse
from literalai import Step as ClientStep
from literalai.step import StepDict as ClientStepDict
from literalai.thread import NumberListFilter, StringFilter, StringListFilter
from literalai.thread import ThreadFilter as ClientThreadFilter
from datetime import datetime


if TYPE_CHECKING:
    from chainlit.element import Element, ElementDict
    from chainlit.step import FeedbackDict, StepDict


class MongoDataLayer(BaseDataLayer):
    def __init__(self, mongodb_uri: str, s3_bucket: str):
        import boto3
        from pymongo import MongoClient, ASCENDING, DESCENDING
        from pymongo.errors import DuplicateKeyError, PyMongoError

        if TYPE_CHECKING:
            from mypy_boto3_s3 import S3Client

        self.mongo_client: MongoClient = MongoClient(mongodb_uri)
        self.s3_client: S3Client = boto3.client("s3")
        self.s3_bucket = s3_bucket

        self.db = self.mongo_client.get_database()
        self.users = self.db.get_collection("users")
        self.threads = self.db.get_collection("threads")
        self.steps = self.db.get_collection("steps")
        self.elements = self.db.get_collection("elements")
        self.feedbacks = self.db.get_collection("feedbacks")

        # Create indexes for faster querying
        try:
            self.threads.create_index(
                [("user.identifier", ASCENDING), ("createdAt", DESCENDING)],
                background=True,
            )
            self.steps.create_index([("threadId", ASCENDING)], background=True)
            self.elements.create_index([("threadId", ASCENDING), ("forId", ASCENDING)], background=True)
            self.feedbacks.create_index([("forId", ASCENDING)], background=True)
        except DuplicateKeyError:
            logger.info("Indexes already exist!")
        except PyMongoError as e:
            logger.warning("Errors creating indexes MongoDB: %r", e)

        logger.info("Mongo data layer initialized")

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
            "value": feedback.value or 0,  # type: ignore
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
        user_dict = self.users.find_one({"identifier": identifier})
        if not user_dict:
            return None
        return PersistedUser(
            id=str(user_dict.pop("_id")),
            **user_dict,
        )

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        _user = await self.get_user(user.identifier)
        if not _user:
            user_dict: Dict[str, Any] = user.to_dict()
            user_dict["createdAt"] = datetime.utcnow().isoformat()
            user_id = str(self.users.insert_one(user_dict).inserted_id)
            return PersistedUser(
                id=user_id,
                **user_dict,
            )
        return _user

    async def upsert_feedback(
        self,
        feedback: Feedback,
    ) -> str:
        feedback_dict = asdict(feedback)
        feedback_id = self.feedbacks.update_one(
            {"forId": feedback.forId},
            {"$set": feedback_dict},
            upsert=True,
        ).upserted_id
        return str(feedback_id)

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        if not element.for_id:
            return

        metadata = {
            "size": element.size,
            "language": element.language,
            "display": element.display,
            "type": element.type,
            "page": getattr(element, "page", None),
        }

        object_key: Optional[str] = None

        if not element.url:
            if element.path:
                async with aiofiles.open(element.path, "rb") as f:
                    content: Union[bytes, str] = await f.read()
            elif element.content:
                content = element.content
            else:
                raise ValueError("Either path or content must be provided")
            assert (
                context.session and context.session.user and context.session.user.identifier
            ), "User is not set in Chainlit context"
            object_key = f"{context.session.user.identifier}/{element.id}" + f"/{element.name}" if element.name else ""
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=object_key,
                Body=content,
                ContentType=element.mime or "",
            )
            element.url = f"s3://{self.s3_bucket}/{object_key}"

        element_dict = {
            "id": element.id,
            "threadId": element.thread_id,
            "stepId": element.for_id,
            "name": element.name,
            "metadata": metadata,
            "type": element.type,
            "mime": element.mime,
            "url": element.url,
            "objectKey": object_key,
        }
        # Set "_id" to the "element.id" from frontend
        self.elements.insert_one({"_id": element.id} | element_dict)

    async def get_element(self, thread_id: str, element_id: str) -> Optional["ElementDict"]:
        element_dict = self.elements.find_one({"_id": element_id, "threadId": thread_id})
        if not element_dict:
            return None
        return element_dict

    @queue_until_user_message()
    async def delete_element(self, element_id: str):
        element_dict = self.elements.find_one_and_delete({"_id": element_id})
        if element_dict and element_dict.get("objectKey"):
            self.s3_client.delete_object(Bucket=self.s3_bucket, Key=element_dict["objectKey"])

    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        await self.update_step(step_dict)

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        metadata = {
            "disableFeedback": step_dict.get("disableFeedback"),
            "isError": step_dict.get("isError"),
            "waitForAnswer": step_dict.get("waitForAnswer"),
            "language": step_dict.get("language"),
            "showInput": step_dict.get("showInput"),
        }

        step: ClientStepDict = {
            "createdAt": step_dict.get("createdAt"),
            "startTime": step_dict.get("start"),
            "endTime": step_dict.get("end"),
            "generation": step_dict.get("generation"),
            "id": step_dict.get("id"),
            "parentId": step_dict.get("parentId"),
            "name": step_dict.get("name"),
            "threadId": step_dict.get("threadId"),
            "type": step_dict.get("type"),
            "metadata": metadata,
        }
        if step_dict.get("input"):
            step["input"] = {"content": step_dict.get("input")}
        if step_dict.get("output"):
            step["output"] = {"content": step_dict.get("output")}
        # Use frontend generated step id for "_id"
        step_with_id = {"_id": step["id"]} | step
        self.steps.update_one({"_id": step["id"]}, step_with_id, upsert=True)

    async def _delete_steps(self, step_ids: List[str]):
        """Delete all elements and steps associated with steps"""
        step_ids_to_delete = [] + step_ids  # Create new list to avoid modifying the original list
        child_steps_cursor = self.steps.find({"parentId": {"$in": step_ids_to_delete}}, {"_id": 1})
        for child_step in child_steps_cursor:
            step_ids_to_delete.append(child_step["_id"])
        elements_cursor = self.elements.find({"stepId": {"$in": step_ids_to_delete}}, {"_id": 1, "objectKey": 1})
        await asyncio.gather(
            *[self.delete_element(element["_id"]) for element in elements_cursor if element.get("objectKey")]
        )
        self.feedbacks.delete_many({"forId": {"$in": step_ids_to_delete}})
        self.steps.delete_many({"_id": {"$in": step_ids_to_delete}})

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        """Delete all elements and steps associated with the step"""
        await self._delete_steps([step_id])

    async def get_thread_author(self, thread_id: str) -> str:
        thread = await self.get_thread(thread_id)
        if not thread:
            return ""
        user = thread.get("user")
        if not user:
            return ""
        return user.get("identifier") or ""

    async def delete_thread(self, thread_id: str):
        thread_dict = await self.get_thread(thread_id)
        if not thread_dict:
            return

        # Delete all steps, feedbacks and elements associated with the thread
        steps_cursor = self.steps.find({"threadId": thread_id}, {"_id": 1})  # Only return the "_id" of steps
        await self._delete_steps([step["_id"] for step in steps_cursor])

        # Delete the thread itself
        self.threads.delete_one({"_id": thread_id})

    async def list_threads(self, pagination: "Pagination", filters: "ThreadFilter") -> "PaginatedResponse[ThreadDict]":
        from pymongo import DESCENDING

        if not filters.userIdentifier:
            raise ValueError("userIdentifier is required")

        client_filters = ClientThreadFilter(
            participantsIdentifier=StringListFilter(operator="in", value=[filters.userIdentifier]),
        )
        if filters.search:
            client_filters.search = StringFilter(operator="ilike", value=filters.search)
        if filters.feedback:
            client_filters.feedbacksValue = NumberListFilter(operator="in", value=[filters.feedback])

        # Build MongoDB query based on filters
        query: Dict[str, Any] = {"user.identifier": filters.userIdentifier}
        if filters.search:
            query["$text"] = {"$search": filters.search}
        if filters.feedback:
            query["feedback.value"] = filters.feedback

        # Apply pagination
        skip = 0 if not pagination.cursor else int(pagination.cursor)
        threads_cursor = self.threads.find(query).sort([("createdAt", DESCENDING)]).skip(skip).limit(pagination.first)

        threads: List[ThreadDict] = [
            {
                "id": thread["_id"],
                "createdAt": thread["createdAt"],
                "name": thread.get("name"),
                "user": thread.get("user"),
                "tags": thread.get("tags"),
                "metadata": thread.get("metadata"),
                "steps": thread.get("steps"),
                "elements": thread.get("elements"),
            }
            for thread in threads_cursor
        ]

        has_next_page = len(threads) == pagination.first
        end_cursor = str(threads[-1]["id"]) if has_next_page else None

        return PaginatedResponse[ThreadDict](
            data=threads,
            pageInfo=PageInfo(hasNextPage=has_next_page, endCursor=end_cursor),
        )

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        thread_dict = self.threads.find_one({"_id": thread_id})
        if not thread_dict:
            return None

        elements: List[ElementDict] = []
        steps: List[StepDict] = []

        steps_cursor = self.steps.find({"threadId": thread_id}).sort([("createdAt", 1)])
        for step in steps_cursor:
            if config.ui.hide_cot and step.get("parentId"):
                continue
            for attachment in step.get("attachments", []):
                elements.append(self.attachment_to_element_dict(attachment))
            if not config.features.prompt_playground and step.get("generation"):
                step.pop("generation", None)
            steps.append(self.step_to_step_dict(step))

        user = None  # type: Optional["UserDict"]

        if thread_dict.get("user"):
            user = {
                "id": str(thread_dict["user"]["_id"]),
                "identifier": thread_dict["user"]["identifier"],
                "metadata": thread_dict["user"]["metadata"],
            }

        return {
            "createdAt": thread_dict["createdAt"],
            "id": str(thread_dict["_id"]),
            "name": thread_dict.get("name"),
            "steps": steps,
            "elements": elements,
            "metadata": thread_dict.get("metadata"),
            "user": user,
            "tags": thread_dict.get("tags"),
        }

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        update_dict: Dict[str, Any] = {}
        if name is not None:
            update_dict["name"] = name
        if user_id is not None:
            update_dict["user"] = {"_id": user_id}
        if metadata is not None:
            update_dict["metadata"] = metadata
        if tags is not None:
            update_dict["tags"] = tags

        self.threads.update_one({"_id": thread_id}, {"$set": update_dict})

    async def delete_user_session(self, id: str) -> bool:
        if not self.threads.delete_one({"metadata.id": id}):
            return False
        return True
