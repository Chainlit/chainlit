import asyncio
import json
import logging
import os
import random
from dataclasses import asdict
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

import aiofiles
import aiohttp
import boto3  # type: ignore
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer
from chainlit.context import context
from chainlit.data import BaseDataLayer, BaseStorageClient, queue_until_user_message
from chainlit.element import ElementDict
from chainlit.logger import logger
from chainlit.step import StepDict
from chainlit.types import (
    Feedback,
    PageInfo,
    PaginatedResponse,
    Pagination,
    ThreadDict,
    ThreadFilter,
)
from chainlit.user import PersistedUser, User

if TYPE_CHECKING:
    from chainlit.element import Element
    from mypy_boto3_dynamodb import DynamoDBClient


_logger = logger.getChild("DynamoDB")
_logger.setLevel(logging.WARNING)


class DynamoDBDataLayer(BaseDataLayer):

    def __init__(
        self,
        table_name: str,
        client: Optional["DynamoDBClient"] = None,
        storage_provider: Optional[BaseStorageClient] = None,
        user_thread_limit: int = 10,
    ):
        if client:
            self.client = client
        else:
            region_name = os.environ.get("AWS_REGION", "us-east-1")
            self.client = boto3.client("dynamodb", region_name=region_name)  # type: ignore

        self.table_name = table_name
        self.storage_provider = storage_provider
        self.user_thread_limit = user_thread_limit

        self._type_deserializer = TypeDeserializer()
        self._type_serializer = TypeSerializer()

    def _get_current_timestamp(self) -> str:
        return datetime.now().isoformat() + "Z"

    def _serialize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            key: self._type_serializer.serialize(value) for key, value in item.items()
        }

    def _deserialize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            key: self._type_deserializer.deserialize(value)
            for key, value in item.items()
        }

    def _update_item(self, key: Dict[str, Any], updates: Dict[str, Any]):
        update_expr: List[str] = []
        expression_attribute_names = {}
        expression_attribute_values = {}

        for index, (attr, value) in enumerate(updates.items()):
            if not value:
                continue

            k, v = f"#{index}", f":{index}"
            update_expr.append(f"{k} = {v}")
            expression_attribute_names[k] = attr
            expression_attribute_values[v] = value

        self.client.update_item(
            TableName=self.table_name,
            Key=self._serialize_item(key),
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=self._serialize_item(expression_attribute_values),
        )

    async def get_user(self, identifier: str) -> Optional["PersistedUser"]:
        _logger.info("DynamoDB: get_user identifier=%s", identifier)

        response = self.client.get_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"USER#{identifier}"},
                "SK": {"S": "USER"},
            },
        )

        if "Item" not in response:
            return None

        user = self._deserialize_item(response["Item"])

        return PersistedUser(
            id=user["id"],
            identifier=user["identifier"],
            createdAt=user["createdAt"],
            metadata=user["metadata"],
        )

    async def create_user(self, user: "User") -> Optional["PersistedUser"]:
        _logger.info("DynamoDB: create_user user.identifier=%s", user.identifier)

        ts = self._get_current_timestamp()
        metadata: Dict[Any, Any] = user.metadata  # type: ignore

        item = {
            "PK": f"USER#{user.identifier}",
            "SK": "USER",
            "id": user.identifier,
            "identifier": user.identifier,
            "metadata": metadata,
            "createdAt": ts,
        }

        self.client.put_item(
            TableName=self.table_name,
            Item=self._serialize_item(item),
        )

        return PersistedUser(
            id=user.identifier,
            identifier=user.identifier,
            createdAt=ts,
            metadata=metadata,
        )

    async def delete_feedback(self, feedback_id: str) -> bool:
        _logger.info("DynamoDB: delete_feedback feedback_id=%s", feedback_id)

        # feedback id = THREAD#{thread_id}::STEP#{step_id}
        thread_id, step_id = feedback_id.split("::")
        thread_id = thread_id.strip("THREAD#")
        step_id = step_id.strip("STEP#")

        self.client.update_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"THREAD#{thread_id}"},
                "SK": {"S": f"STEP#{step_id}"},
            },
            UpdateExpression="REMOVE #feedback",
            ExpressionAttributeNames={"#feedback": "feedback"},
        )

        return True

    async def upsert_feedback(self, feedback: Feedback) -> str:
        _logger.info(
            "DynamoDB: upsert_feedback thread=%s step=%s value=%s",
            feedback.threadId,
            feedback.forId,
            feedback.value,
        )

        if not feedback.forId:
            raise ValueError(
                "DynamoDB datalayer expects value for feedback.threadId got None"
            )

        feedback.id = f"THREAD#{feedback.threadId}::STEP#{feedback.forId}"
        searialized_feedback = self._type_serializer.serialize(asdict(feedback))

        self.client.update_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"THREAD#{feedback.threadId}"},
                "SK": {"S": f"STEP#{feedback.forId}"},
            },
            UpdateExpression="SET #feedback = :feedback",
            ExpressionAttributeNames={"#feedback": "feedback"},
            ExpressionAttributeValues={":feedback": searialized_feedback},
        )

        return feedback.id

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        _logger.info(
            "DynamoDB: create_element thread=%s step=%s type=%s",
            element.thread_id,
            element.for_id,
            element.type,
        )
        _logger.debug("DynamoDB: create_element: %s", element.to_dict())

        if not element.for_id:
            return

        if not self.storage_provider:
            _logger.warning(
                "DynamoDB: create_element error. No storage_provider is configured!"
            )
            return

        content: Optional[Union[bytes, str]] = None

        if element.content:
            content = element.content

        elif element.path:
            _logger.debug("DynamoDB: create_element reading file %s", element.path)
            async with aiofiles.open(element.path, "rb") as f:
                content = await f.read()

        elif element.url:
            _logger.debug("DynamoDB: create_element http %s", element.url)
            async with aiohttp.ClientSession() as session:
                async with session.get(element.url) as response:
                    if response.status == 200:
                        content = await response.read()
                    else:
                        raise ValueError(
                            f"Failed to read content from {element.url} status {response.status}",
                        )

        else:
            raise ValueError("Element url, path or content must be provided")

        if content is None:
            raise ValueError("Content is None, cannot upload file")

        if not element.mime:
            element.mime = "application/octet-stream"

        context_user = context.session.user
        user_folder = getattr(context_user, "id", "unknown")
        file_object_key = f"{user_folder}/{element.thread_id}/{element.id}"

        uploaded_file = await self.storage_provider.upload_file(
            object_key=file_object_key,
            data=content,
            mime=element.mime,
            overwrite=True,
        )
        if not uploaded_file:
            raise ValueError(
                "DynamoDB Error: create_element, Failed to persist data in storage_provider",
            )

        element_dict: Dict[str, Any] = element.to_dict()  # type: ignore
        element_dict.update(
            {
                "PK": f"THREAD#{element.thread_id}",
                "SK": f"ELEMENT#{element.id}",
                "url": uploaded_file.get("url"),
                "objectKey": uploaded_file.get("object_key"),
            }
        )

        self.client.put_item(
            TableName=self.table_name,
            Item=self._serialize_item(element_dict),
        )

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional["ElementDict"]:
        _logger.info(
            "DynamoDB: get_element thread=%s element=%s", thread_id, element_id
        )

        response = self.client.get_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"THREAD#{thread_id}"},
                "SK": {"S": f"ELEMENT#{element_id}"},
            },
        )

        if "Item" not in response:
            return None

        return self._deserialize_item(response["Item"])  # type: ignore

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        thread_id = context.session.thread_id
        _logger.info(
            "DynamoDB: delete_element thread=%s element=%s", thread_id, element_id
        )

        self.client.delete_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"THREAD#{thread_id}"},
                "SK": {"S": f"ELEMENT#{element_id}"},
            },
        )

    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        _logger.info(
            "DynamoDB: create_step thread=%s step=%s",
            step_dict.get("threadId"),
            step_dict.get("id"),
        )
        _logger.debug("DynamoDB: create_step: %s", step_dict)

        item = dict(step_dict)
        item.update(
            {
                # ignore type, dynamo needs these so we want to fail if not set
                "PK": f"THREAD#{step_dict['threadId']}",  # type: ignore
                "SK": f"STEP#{step_dict['id']}",  # type: ignore
            }
        )

        self.client.put_item(
            TableName=self.table_name,
            Item=self._serialize_item(item),
        )

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        _logger.info(
            "DynamoDB: update_step thread=%s step=%s",
            step_dict.get("threadId"),
            step_dict.get("id"),
        )
        _logger.debug("DynamoDB: update_step: %s", step_dict)

        self._update_item(
            key={
                # ignore type, dynamo needs these so we want to fail if not set
                "PK": f"THREAD#{step_dict['threadId']}",  # type: ignore
                "SK": f"STEP#{step_dict['id']}",  # type: ignore
            },
            updates=step_dict,  # type: ignore
        )

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        thread_id = context.session.thread_id
        _logger.info("DynamoDB: delete_feedback thread=%s step=%s", thread_id, step_id)

        self.client.delete_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"THREAD#{thread_id}"},
                "SK": {"S": f"STEP#{step_id}"},
            },
        )

    async def get_thread_author(self, thread_id: str) -> str:
        _logger.info("DynamoDB: get_thread_author thread=%s", thread_id)

        response = self.client.get_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"THREAD#{thread_id}"},
                "SK": {"S": "THREAD"},
            },
            ProjectionExpression="userId",
        )

        if "Item" not in response:
            raise ValueError(f"Author not found for thread_id {thread_id}")

        item = self._deserialize_item(response["Item"])
        return item["userId"]

    async def delete_thread(self, thread_id: str):
        _logger.info("DynamoDB: delete_thread thread=%s", thread_id)

        thread = await self.get_thread(thread_id)
        if not thread:
            return

        items: List[Any] = thread["steps"]
        if thread["elements"]:
            items.extend(thread["elements"])

        delete_requests = []
        for item in items:
            key = self._serialize_item({"PK": item["PK"], "SK": item["SK"]})
            req = {"DeleteRequest": {"Key": key}}
            delete_requests.append(req)

        BATCH_ITEM_SIZE = 25  # pylint: disable=invalid-name
        for i in range(0, len(delete_requests), BATCH_ITEM_SIZE):
            chunk = delete_requests[i : i + BATCH_ITEM_SIZE]  # noqa: E203
            response = self.client.batch_write_item(
                RequestItems={
                    self.table_name: chunk,  # type: ignore
                }
            )

            backoff_time = 1
            while "UnprocessedItems" in response and response["UnprocessedItems"]:
                backoff_time *= 2
                # Cap the backoff time at 32 seconds & add jitter
                delay = min(backoff_time, 32) + random.uniform(0, 1)
                await asyncio.sleep(delay)

                response = self.client.batch_write_item(
                    RequestItems=response["UnprocessedItems"]
                )

        self.client.delete_item(
            TableName=self.table_name,
            Key={
                "PK": {"S": f"THREAD#{thread_id}"},
                "SK": {"S": "THREAD"},
            },
        )

    async def list_threads(
        self, pagination: "Pagination", filters: "ThreadFilter"
    ) -> "PaginatedResponse[ThreadDict]":
        _logger.info("DynamoDB: list_threads filters.userId=%s", filters.userId)

        if filters.feedback:
            _logger.warning("DynamoDB: filters on feedback not supported")

        paginated_response: PaginatedResponse[ThreadDict] = PaginatedResponse(
            data=[],
            pageInfo=PageInfo(
                hasNextPage=False, startCursor=pagination.cursor, endCursor=None
            ),
        )

        query_args: Dict[str, Any] = {
            "TableName": self.table_name,
            "IndexName": "UserThread",
            "ScanIndexForward": False,
            "Limit": self.user_thread_limit,
            "KeyConditionExpression": "#UserThreadPK = :pk",
            "ExpressionAttributeNames": {
                "#UserThreadPK": "UserThreadPK",
            },
            "ExpressionAttributeValues": {
                ":pk": {"S": f"USER#{filters.userId}"},
            },
        }

        if pagination.cursor:
            query_args["ExclusiveStartKey"] = json.loads(pagination.cursor)

        if filters.search:
            query_args["FilterExpression"] = "contains(#name, :search)"
            query_args["ExpressionAttributeNames"]["#name"] = "name"
            query_args["ExpressionAttributeValues"][":search"] = {"S": filters.search}

        response = self.client.query(**query_args)  # type: ignore

        if "LastEvaluatedKey" in response:
            paginated_response.pageInfo.hasNextPage = True
            paginated_response.pageInfo.endCursor = json.dumps(
                response["LastEvaluatedKey"]
            )

        for item in response["Items"]:
            deserialized_item: Dict[str, Any] = self._deserialize_item(item)
            thread = ThreadDict(  # type: ignore
                id=deserialized_item["PK"].strip("THREAD#"),
                createdAt=deserialized_item["UserThreadSK"].strip("TS#"),
                name=deserialized_item["name"],
            )
            paginated_response.data.append(thread)

        return paginated_response

    async def get_thread(self, thread_id: str) -> "Optional[ThreadDict]":
        _logger.info("DynamoDB: get_thread thread=%s", thread_id)

        # Get all thread records
        thread_items: List[Any] = []

        cursor: Dict[str, Any] = {}
        while True:
            response = self.client.query(
                TableName=self.table_name,
                KeyConditionExpression="#pk = :pk",
                ExpressionAttributeNames={"#pk": "PK"},
                ExpressionAttributeValues={":pk": {"S": f"THREAD#{thread_id}"}},
                **cursor,
            )

            deserialized_items = map(self._deserialize_item, response["Items"])
            thread_items.extend(deserialized_items)

            if "LastEvaluatedKey" not in response:
                break
            cursor["ExclusiveStartKey"] = response["LastEvaluatedKey"]

        if len(thread_items) == 0:
            return None

        # process accordingly
        thread_dict: Optional[ThreadDict] = None
        steps = []
        elements = []

        for item in thread_items:
            if item["SK"] == "THREAD":
                thread_dict = item

            elif item["SK"].startswith("ELEMENT"):
                elements.append(item)

            elif item["SK"].startswith("STEP"):
                if "feedback" in item:  # Decimal is not json serializable
                    item["feedback"]["value"] = int(item["feedback"]["value"])
                steps.append(item)

        if not thread_dict:
            if len(thread_items) > 0:
                _logger.warning(
                    "DynamoDB: found orphaned items for thread=%s", thread_id
                )
            return None

        steps.sort(key=lambda i: i["createdAt"])
        thread_dict.update(
            {
                "steps": steps,
                "elements": elements,
            }
        )

        return thread_dict

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        _logger.info("DynamoDB: update_thread thread=%s userId=%s", thread_id, user_id)
        _logger.debug(
            "DynamoDB: update_thread name=%s tags=%s metadata=%s", name, tags, metadata
        )

        ts = self._get_current_timestamp()

        item = {
            # GSI: UserThread
            "UserThreadSK": f"TS#{ts}",
            #
            "id": thread_id,
            "createdAt": ts,
            "name": name,
            "userId": user_id,
            "userIdentifier": user_id,
            "tags": tags,
            "metadata": metadata,
        }

        if user_id:
            # user_id may be None on subsequent calls, don't update UserThreadPK to "USER#{None}"
            item["UserThreadPK"] = f"USER#{user_id}"

        self._update_item(
            key={
                "PK": f"THREAD#{thread_id}",
                "SK": "THREAD",
            },
            updates=item,
        )

    async def delete_user_session(self, id: str) -> bool:
        return True  # Not sure why documentation wants this

    async def build_debug_url(self) -> str:
        return ""
