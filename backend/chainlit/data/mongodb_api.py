import mimetypes
from bson import ObjectId
import os

from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from chainlit import logger
from pymongo import MongoClient, DESCENDING, ASCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError
from literalai.my_types import (
    Attachment,
    AttachmentDict,
    ChatGeneration,
    CompletionGeneration,
    Feedback,
    FeedbackDict,
    FeedbackStrategy,
    PageInfo,
    PaginatedResponse,
    User,
    UserDict,
)
from literalai.step import Step, StepDict, StepType
from literalai.thread import Thread
from literalai.helper import utc_now
from literalai.thread import ThreadFilter
from literalai.api import API as LiteralAIAPI


class API:
    def __init__(self, mongodb_uri: str):
        # MongoDB client
        self.mongodb_client: MongoClient = MongoClient(mongodb_uri)
        db = self.mongodb_client.get_database()
        self.users = db["users"]
        self.threads = db["threads"]
        self.feedback = db["feedback"]
        self.attachments = db["attachments"]
        self.steps = db["steps"]
        self.generations = db["generations"]

        # Create indexes for faster querying
        try:
            self.users.create_index([("identifier", ASCENDING)], background=True)
            self.threads.create_index(
                [("user.identifier", ASCENDING), ("createdAt", DESCENDING)],
                background=True,
            )
            self.steps.create_index([("threadId", ASCENDING)], background=True)
            self.attachments.create_index([("threadId", ASCENDING), ("stepId", ASCENDING)], background=True)
            self.feedback.create_index([("threadId", ASCENDING), ("stepId", ASCENDING)], background=True)
        except DuplicateKeyError:
            logger.info("Indexes already exist!")
        except PyMongoError as e:
            logger.warning("Errors creating indexes MongoDB: %r", e)

        logger.info("Mongo API initialized")

    # User API

    async def create_user(self, identifier: str, metadata: Optional[Dict] = None) -> User:
        user_data = {
            "identifier": identifier,
            "metadata": metadata,
            "createdAt": utc_now(),
        }

        user_id = self.users.insert_one(user_data).inserted_id

        user_data["id"] = str(user_id)

        logger.info("User created: %r", user_data)

        return User.from_dict(user_data)

    async def update_user(self, id: str, identifier: Optional[str] = None, metadata: Optional[Dict] = None) -> User:
        update_data: UserDict = {}
        if identifier is not None:
            update_data["identifier"] = identifier
        if metadata is not None:
            update_data["metadata"] = metadata

        self.users.update_one({"_id": ObjectId(id)}, {"$set": update_data})

        user = self.users.find_one({"_id": ObjectId(id)})
        assert user is not None, "User not found"
        user["id"] = str(user["_id"])

        logger.info("User updated: %r", user)

        return User.from_dict(user)

    async def get_user(self, id: Optional[str] = None, identifier: Optional[str] = None) -> Optional[User]:
        query = {}
        if id is not None:
            query["_id"] = id
        elif identifier is not None:
            query["identifier"] = identifier

        user = self.users.find_one(query)

        if user:
            if user.get("deactivate"):
                logger.info("User deactivated: %r", user)
                return None

            user["id"] = str(user["_id"])

        logger.info("User found: %r", user)

        return User.from_dict(user) if user else None

    async def delete_user(self, id: str) -> str:
        result = self.users.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"deactivate": True, "deactivateAt": utc_now()}},
        )

        if result.modified_count > 0:
            logger.info("User deactivated: %r", result)
        else:
            logger.warning("User not found: %r", result)

        return id

    # Thread API

    async def list_threads(
        self,
        first: Optional[int] = None,
        after: Optional[str] = None,
        filters: Optional[ThreadFilter] = None,
    ) -> PaginatedResponse:
        # TODO: currently filters is not correct, will need to be fixed so we can get the threads displayed
        # Run the mongodb locally and see what the threads collection looks like then update the query below
        query: Dict[str, Any] = {}
        if filters:
            # Implement filter logic using MongoDB query operators
            if filters.createdAt:
                query["createdAt"] = {"$" + filters.createdAt.operator: filters.createdAt.value}
            if filters.afterCreatedAt:
                query["createdAt"] = {"$" + filters.afterCreatedAt.operator: filters.afterCreatedAt.value}
            if filters.beforeCreatedAt:
                query["createdAt"] = {"$" + filters.beforeCreatedAt.operator: filters.beforeCreatedAt.value}
            if filters.environment:
                query["environment"] = {"$" + filters.environment.operator: filters.environment.value}
            if filters.feedbacksValue:
                query["feedbacks.value"] = {"$" + filters.feedbacksValue.operator: filters.feedbacksValue.value}
            if filters.participantsIdentifier:
                query["participant.identifier"] = {
                    "$" + filters.participantsIdentifier.operator: filters.participantsIdentifier.value
                }
            if filters.search:
                query["$text"] = {"$search": filters.search.value}

        logger.info("Threads query: %r", query)

        threads = self.threads.find(query).sort("createdAt", DESCENDING)

        if first:
            threads = threads.limit(first)

        if after:
            # Implement pagination logic using MongoDB cursor
            threads = threads.skip(int(after))

        thread_data = [
            Thread.from_dict(thread) for thread in threads
        ]  # Assuming Thread.from_dict handles conversion from MongoDB document

        # Construct PaginatedResponse with pageInfo and data
        has_next_page = len(thread_data) > first if first else False
        page_info = PageInfo(hasNextPage=has_next_page, endCursor=str(len(thread_data)))

        logger.info("Threads found: %r", thread_data)

        return PaginatedResponse(pageInfo=page_info, data=thread_data)

    async def create_thread(
        self,
        name: Optional[str] = None,
        metadata: Optional[Dict] = None,
        participant_id: Optional[str] = None,
        environment: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Thread:
        thread_data = {
            "name": name,
            "metadata": metadata,
            "participantId": participant_id,
            "environment": environment,
            "tags": tags,
            "createdAt": utc_now(),
        }

        thread_id = self.threads.insert_one(thread_data).inserted_id

        thread_data["id"] = str(thread_id)

        logger.info("Thread created: %r", thread_data)

        return Thread.from_dict(thread_data)

    async def upsert_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        metadata: Optional[Dict] = None,
        participant_id: Optional[str] = None,
        environment: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Thread:
        update_data: Dict[str, Any] = {}
        if name is not None:
            update_data["name"] = name
        if metadata is not None:
            update_data["metadata"] = metadata
        if participant_id is not None:
            update_data["participantId"] = participant_id
        if environment is not None:
            update_data["environment"] = environment
        if tags is not None:
            update_data["tags"] = tags

        self.threads.update_one({"_id": thread_id}, {"$set": update_data}, upsert=True)

        thread = self.threads.find_one({"_id": thread_id})
        assert thread is not None, "Thread not found"
        thread["id"] = str(thread["_id"])

        logger.info("Thread updated: %r", thread)

        return Thread.from_dict(thread)

    async def update_thread(
        self,
        id: str,
        name: Optional[str] = None,
        metadata: Optional[Dict] = None,
        participant_id: Optional[str] = None,
        environment: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Thread:
        # Implementation similar to upsert_thread, but without upsert=True
        update_data: Dict[str, Any] = {}
        if name is not None:
            update_data["name"] = name
        if metadata is not None:
            update_data["metadata"] = metadata
        if participant_id is not None:
            update_data["participantId"] = participant_id
        if environment is not None:
            update_data["environment"] = environment
        if tags is not None:
            update_data["tags"] = tags

        self.threads.update_one({"_id": ObjectId(id)}, {"$set": update_data})

        thread = self.threads.find_one({"_id": ObjectId(id)})
        assert thread is not None, "Thread not found"
        thread["id"] = str(thread["_id"])

        logger.info("Thread updated: %r", thread)

        return Thread.from_dict(thread)

    async def get_thread(self, id: str) -> Optional[Thread]:
        thread = self.threads.find_one({"_id": ObjectId(id)})

        if thread:
            if thread.get("deactivate"):
                logger.info("Thread deactivated: %r", thread)
                return None

            thread["id"] = str(thread["_id"])

        logger.info("Thread found: %r", thread)

        return Thread.from_dict(thread) if thread else None

    async def delete_thread(self, id: str) -> bool:
        result = self.threads.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"deactivate": True, "deactivateAt": utc_now()}},
        )

        logger.info("Thread deactivated: %r", result)

        return result.modified_count > 0

    # Feedback API

    async def create_feedback(
        self,
        step_id: str,
        value: int,
        comment: Optional[str] = None,
        strategy: Optional[FeedbackStrategy] = None,
    ) -> Feedback:
        assert strategy is not None, "Feedback strategy must be provided"
        feedback_data: FeedbackDict = {
            "stepId": step_id,
            "value": value,
            "comment": comment,
            "strategy": strategy,
        }

        feedback_id = self.feedback.insert_one(feedback_data).inserted_id

        feedback_data["id"] = str(feedback_id)

        logger.info("Feedback created: %r", feedback_data)

        return Feedback.from_dict(feedback_data)

    async def update_feedback(
        self,
        id: str,
        update_params: LiteralAIAPI.FeedbackUpdate,
    ) -> "Feedback":
        update_data: FeedbackDict = {}
        if update_params.get("comment") is not None:
            update_data["comment"] = update_params["comment"]
        if update_params.get("value") is not None:
            update_data["value"] = update_params["value"]
        if update_params.get("strategy") is not None:
            assert update_params["strategy"] is not None, "Feedback strategy must be provided"
            update_data["strategy"] = update_params["strategy"]

        self.feedback.update_one({"_id": ObjectId(id)}, {"$set": update_data})

        feedback = self.feedback.find_one({"_id": ObjectId(id)})
        assert feedback is not None, "Feedback not found"
        feedback["id"] = str(feedback["_id"])

        logger.info("Feedback updated: %r", feedback)

        return Feedback.from_dict(feedback)

    # Attachment API

    async def create_attachment(
        self,
        thread_id: str,
        step_id: str,
        id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        mime: Optional[str] = None,
        name: Optional[str] = None,
        object_key: Optional[str] = None,
        url: Optional[str] = None,
        content: Optional[Union[bytes, str]] = None,
        path: Optional[str] = None,
    ) -> Attachment:
        if not content and not url and not path:
            raise Exception("Either content, path or attachment url must be provided")

        if content and path:
            raise Exception("Only one of content and path must be provided")

        if (content and url) or (path and url):
            raise Exception("Only one of content, path and attachment url must be provided")

        if path:
            # TODO: if attachment.mime is text, we could read as text?
            with open(path, "rb") as f:
                content = f.read()
            if not name:
                name = path.split("/")[-1]
            if not mime:
                mime, _ = mimetypes.guess_type(path)
                mime = mime or "application/octet-stream"

        if not name:
            raise Exception("Attachment name must be provided")

        if content:
            uploaded = await self.upload_file(content=content, thread_id=thread_id, mime=mime)

            if uploaded["object_key"] is None or uploaded["url"] is None:
                raise Exception("Failed to upload file")

            object_key = uploaded["object_key"]
            url = None
            if not object_key:
                url = uploaded["url"]

        attachment_data: AttachmentDict = {
            "threadId": thread_id,
            "stepId": step_id,
            "metadata": metadata,
            "mime": mime,
            "name": name,
            "objectKey": object_key,
            "url": url,
        }

        # Use generated id as _id if available
        attachment_id = self.attachments.insert_one({"_id": ObjectId(id)} if id else {} | attachment_data).inserted_id

        attachment_data["id"] = str(attachment_id)

        logger.info("Attachment created: %r", attachment_data)

        return Attachment.from_dict(attachment_data)

    async def update_attachment(
        self,
        id: str,
        update_params: LiteralAIAPI.AttachmentUpload,
    ) -> Attachment:
        update_data: AttachmentDict = {}
        if update_params.get("metadata") is not None:
            update_data["metadata"] = update_params["metadata"]
        if update_params.get("mime") is not None:
            update_data["mime"] = update_params["mime"]
        if update_params.get("name") is not None:
            update_data["name"] = update_params["name"]
        if update_params.get("objectKey") is not None:
            update_data["objectKey"] = update_params["objectKey"]
        if update_params.get("url") is not None:
            update_data["url"] = update_params["url"]

        self.attachments.update_one({"_id": ObjectId(id)}, {"$set": update_data})

        attachment = self.attachments.find_one({"_id": ObjectId(id)})
        assert attachment is not None, "Attachment not found"
        attachment["id"] = str(attachment["_id"])

        logger.info("Attachment updated: %r", attachment)

        return Attachment.from_dict(attachment)

    async def get_attachment(self, id: str) -> Optional[Attachment]:
        attachment = self.attachments.find_one({"_id": ObjectId(id)})

        if attachment:
            if attachment.get("deactivate"):
                logger.info("Attachment deactivated: %r", attachment)
                return None

            attachment["id"] = str(attachment["_id"])

        logger.info("Attachment found: %r", attachment)

        return Attachment.from_dict(attachment) if attachment else None

    async def delete_attachment(self, id: str) -> str:
        attachment = self.attachments.find_one({"_id": ObjectId(id)})

        if attachment and attachment.get("objectKey"):
            await self.delete_file(attachment["objectKey"])

        self.attachments.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"deactivate": True, "deactivateAt": utc_now()}},
        )

        logger.info("Attachment deactivated: %r", attachment)

        return id

    # Step API

    async def create_step(
        self,
        thread_id: Optional[str] = None,
        type: Optional[StepType] = "undefined",
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        input: Optional[Dict] = None,
        output: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
        parent_id: Optional[str] = None,
        name: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Step:
        step_data: StepDict = {
            "threadId": thread_id,
            "type": type,
            "startTime": start_time,
            "endTime": end_time,
            "input": input,
            "output": output,
            "metadata": metadata,
            "parentId": parent_id,
            "name": name,
            "tags": tags,
        }

        step_id = self.steps.insert_one(step_data).inserted_id

        step_data["id"] = str(step_id)

        logger.info("Step created: %r", step_data)

        return Step.from_dict(step_data)

    async def update_step(
        self,
        id: str,
        type: Optional[StepType] = None,
        input: Optional[Dict] = None,
        output: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
        name: Optional[str] = None,
        tags: Optional[List[str]] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        parent_id: Optional[str] = None,
    ) -> "Step":
        update_data: StepDict = {}
        if type is not None:
            update_data["type"] = type
        if input is not None:
            update_data["input"] = input
        if output is not None:
            update_data["output"] = output
        if metadata is not None:
            update_data["metadata"] = metadata
        if name is not None:
            update_data["name"] = name
        if tags is not None:
            update_data["tags"] = tags
        if start_time is not None:
            update_data["startTime"] = start_time
        if end_time is not None:
            update_data["endTime"] = end_time
        if parent_id is not None:
            update_data["parentId"] = parent_id

        self.steps.update_one({"_id": ObjectId(id)}, {"$set": update_data})

        step = self.steps.find_one({"_id": ObjectId(id)})
        assert step is not None, "Step not found"
        step["id"] = str(step["_id"])

        logger.info("Step updated: %r", step)

        return Step.from_dict(step)

    async def get_step(self, id: str) -> Optional[Step]:
        step = self.steps.find_one({"_id": ObjectId(id)})

        if step:
            if step.get("deactivate"):
                logger.info("Step deactivated: %r", step)
                return None
            step["id"] = str(step["_id"])

        logger.info("Step found: %r", step)

        return Step.from_dict(step) if step else None

    async def delete_step(self, id: str) -> bool:
        result = self.steps.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"deactivate": True, "deactivateAt": utc_now()}},
        )

        logger.info("Step deactivated: %r", result)

        return result.modified_count > 0

    async def send_steps(self, steps: List[Union[StepDict, Step]]) -> Dict:
        step_data: List[StepDict] = [step.to_dict() if isinstance(step, Step) else step for step in steps]

        for step in step_data:
            if step.get("id") is not None:
                self.steps.update_one({"_id": step.pop("id")}, {"$set": step}, upsert=True)
                logger.info("Step updated: %r", step)
            else:
                self.steps.insert_one(step)
                logger.info("Step created: %r", step)

        return {"ok": True, "message": "Steps ingested successfully"}

    # Generation API

    async def create_generation(self, generation: Union[ChatGeneration, CompletionGeneration]) -> str:
        generation_data = generation.to_dict()

        logger.info("Generation created: %r", generation_data)

        return str(self.generations.insert_one(generation_data).inserted_id)

    # Blob file storage API. Overwrite these methods to use a different blob storage provider.

    async def upload_file(
        self,
        content: Union[bytes, str],
        thread_id: str,
        mime: Optional[str] = "application/octet-stream",
    ) -> Dict:
        id = str(ObjectId())
        s3_object_key = f"attachments/{thread_id}/{id}"
        assert mime is not None, "MIME type is required"

        CHAINLIT_S3_BUCKET = os.environ.get("CHAINLIT_S3_BUCKET")
        import boto3

        if TYPE_CHECKING:
            from mypy_boto3_s3 import S3Client

        assert CHAINLIT_S3_BUCKET is not None, "CHAINLIT_S3_BUCKET environment variable not set"

        s3_client: S3Client = boto3.client("s3")
        s3_client.put_object(Bucket=CHAINLIT_S3_BUCKET, Key=s3_object_key, Body=content, ContentType=mime)

        return {
            "object_key": s3_object_key,
            "url": f"s3://{CHAINLIT_S3_BUCKET}/{s3_object_key}",
        }

    async def delete_file(self, object_key: str):
        # Enable bucket versioning to avoid deleting permanently
        CHAINLIT_S3_BUCKET = os.environ.get("CHAINLIT_S3_BUCKET")

        assert CHAINLIT_S3_BUCKET is not None, "CHAINLIT_S3_BUCKET environment variable not set"

        import boto3

        if TYPE_CHECKING:
            from mypy_boto3_s3 import S3Client

        s3_client: S3Client = boto3.client("s3")
        s3_client.delete_object(Bucket=CHAINLIT_S3_BUCKET, Key=object_key)

    # Dataset API
    # TODO: Check if we need Dataset API for custom data layer

    # Prompt API
    # TODO: Check if we need Prompt API for custom data layer
