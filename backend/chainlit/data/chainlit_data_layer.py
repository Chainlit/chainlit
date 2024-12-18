import json
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

import aiofiles
import aiohttp
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from chainlit.data.base import BaseDataLayer
from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.data.utils import queue_until_user_message
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
    from chainlit.element import Element, ElementDict
    from chainlit.step import StepDict


class ChainlitDataLayer(BaseDataLayer):
    def __init__(
        self,
        database_url: str,
        storage_client: Optional[BaseStorageClient] = None,
        show_logger: bool = False,
    ):
        self.engine = create_async_engine(database_url)
        self.async_session = sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )  # type: ignore
        self.storage_client = storage_client
        self.show_logger = show_logger

    async def get_current_timestamp(self) -> datetime:
        return datetime.now()

    async def execute_query(self, query: str, params: Union[Dict, None] = None) -> Any:
        async with self.async_session() as session:
            try:
                result = await session.execute(text(query), params or {})
                await session.commit()
                return result
            except Exception as e:
                await session.rollback()
                logger.error(f"Database error: {e!s}")
                raise

    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        query = """
        SELECT * FROM "Participant" 
        WHERE identifier = :identifier
        """
        result = await self.execute_query(query, {"identifier": identifier})
        row = result.first()
        if not row:
            return None

        return PersistedUser(
            id=str(row.id),
            identifier=row.identifier,
            createdAt=row.createdAt.isoformat(),
            metadata=row.metadata,
        )

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        query = """
        INSERT INTO "Participant" (id, identifier, metadata, "createdAt", "updatedAt")
        VALUES (:id, :identifier, :metadata, :created_at, :updated_at)
        ON CONFLICT (identifier) DO UPDATE
        SET metadata = :metadata
        RETURNING *
        """
        now = await self.get_current_timestamp()
        params = {
            "id": str(uuid.uuid4()),
            "identifier": user.identifier,
            "metadata": json.dumps(user.metadata),
            "created_at": now,
            "updated_at": now,
        }
        result = await self.execute_query(query, params)
        row = result.first()

        return PersistedUser(
            id=str(row.id),
            identifier=row.identifier,
            createdAt=row.createdAt.isoformat(),
            metadata=row.metadata,
        )

    async def delete_feedback(self, feedback_id: str) -> bool:
        query = """
        DELETE FROM "Score" WHERE id = :feedback_id
        """
        await self.execute_query(query, {"feedback_id": feedback_id})
        return True

    async def upsert_feedback(self, feedback: Feedback) -> str:
        query = """
        INSERT INTO "Score" (id, "stepId", type, name, value, "valueLabel", comment, scorer)
        VALUES (:id, :step_id, :type, :name, :value, :value_label, :comment, :scorer)
        ON CONFLICT (id) DO UPDATE
        SET value = :value, comment = :comment
        RETURNING id
        """
        feedback_id = feedback.id or str(uuid.uuid4())
        params = {
            "id": feedback_id,
            "step_id": feedback.forId,
            "type": "HUMAN",
            "name": "user_feedback",
            "value": float(feedback.value),
            "value_label": None,
            "comment": feedback.comment,
            "scorer": None,
        }
        result = await self.execute_query(query, params)
        return str(result.scalar())

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        if not self.storage_client:
            logger.warn(
                "Data Layer: create_element error. No cloud storage configured!"
            )
            return

        if not element.for_id:
            return

        if element.thread_id:
            query = 'SELECT id FROM "Thread" WHERE id = :thread_id'
            result = await self.execute_query(query, {"thread_id": element.thread_id})
            if not result.first():
                await self.update_thread(thread_id=element.thread_id)

        content: Optional[Union[bytes, str]] = None

        if element.path:
            async with aiofiles.open(element.path, "rb") as f:
                content = await f.read()
        elif element.url:
            async with aiohttp.ClientSession() as session:
                async with session.get(element.url) as response:
                    if response.status == 200:
                        content = await response.read()
                    else:
                        content = None
        elif element.content:
            content = element.content
        else:
            raise ValueError("Element url, path or content must be provided")

        if content is None:
            raise ValueError("Content is None, cannot upload file")

        if element.thread_id:
            path = f"threads/{element.thread_id}/files/{element.name}"
        else:
            path = f"files/{element.name}"

        await self.storage_client.upload_file(
            object_key=path,
            data=content,
            mime=element.mime or "application/octet-stream",
            overwrite=True,
        )

        query = """
        INSERT INTO "Attachment" (
            id, "threadId", "stepId", metadata, mime, name, "objectKey", url
        ) VALUES (
            :id, :thread_id, :step_id, :metadata, :mime, :name, :object_key, :url
        )
        """
        params = {
            "id": element.id,
            "name": element.name,
            "thread_id": element.thread_id,
            "step_id": element.for_id,
            "metadata": json.dumps(
                {
                    "size": element.size,
                    "language": element.language,
                    "display": element.display,
                    "type": element.type,
                    "page": getattr(element, "page", None),
                }
            ),
            "mime": element.mime,
            "object_key": path,
            "url": element.url,
        }
        await self.execute_query(query, params)

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional[ElementDict]:
        query = """
        SELECT * FROM "Attachment"
        WHERE id = :element_id AND "threadId" = :thread_id
        """
        result = await self.execute_query(
            query, {"element_id": element_id, "thread_id": thread_id}
        )
        row: Dict[str, Any] = result.first()

        if not row:
            return None

        return ElementDict(
            id=str(row.get("id")),
            threadId=str(row.get("threadId")),
            type="file",
            url=str(row.get("url")),
            name=str(row.get("name")),
            mime=str(row.get("mime")),
            objectKey=str(row.get("objectKey")),
            forId=str(row.get("stepId")),
            chainlitKey=row.get("chainlitKey"),
            display=row["display"],
            size=row["size"],
            language=row["language"],
            page=row["page"],
            autoPlay=row.get("autoPlay"),
            playerConfig=row.get("playerConfig"),
        )

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        """Does not delete the actual file from storage."""

        query = """
        DELETE FROM "Attachment" 
        WHERE id = :element_id
        """
        if thread_id:
            query += ' AND "threadId" = :thread_id'

        await self.execute_query(
            query, {"element_id": element_id, "thread_id": thread_id}
        )

    @queue_until_user_message()
    async def create_step(self, step_dict: StepDict):
        if step_dict.get("threadId"):
            thread_query = """
            SELECT id FROM "Thread" WHERE id = :thread_id
            """
            thread_result = await self.execute_query(
                thread_query, {"thread_id": step_dict["threadId"]}
            )
            if not thread_result.first():
                await self.update_thread(thread_id=step_dict["threadId"])

        now = await self.get_current_timestamp()

        if step_dict.get("parentId"):
            parent_query = """
            SELECT id FROM "Step" WHERE id = :parent_id
            """
            parent_result = await self.execute_query(
                parent_query, {"parent_id": step_dict["parentId"]}
            )
            if not parent_result.first():
                await self.create_step(
                    {
                        "id": step_dict["parentId"],
                        "metadata": json.dumps(step_dict.get("metadata", {})),
                        "type": "run",
                        "start_time": now,
                        "end_time": now,
                        "variables": json.dumps(step_dict.get("variables", {})),
                        "settings": json.dumps(step_dict.get("settings", {})),
                        "tools": json.dumps(step_dict.get("tools", {})),
                    }
                )
        query = """
        INSERT INTO "Step" (
            id, "threadId", "parentId", input, metadata, name, output,
            type, "startTime", "endTime", variables, settings, tools,
            "rootRunId"
        ) VALUES (
            :id, :thread_id, :parent_id, :input, :metadata, :name, :output, 
            :type, :start_time, :end_time, :variables, :settings, :tools,
            :root_run_id
        )
        ON CONFLICT (id) DO UPDATE SET
            input = EXCLUDED.input,
            metadata = EXCLUDED.metadata,
            name = EXCLUDED.name,
            output = EXCLUDED.output,
            type = EXCLUDED.type,
            "startTime" = EXCLUDED."startTime",
            "endTime" = EXCLUDED."endTime",
            variables = EXCLUDED.variables,
            settings = EXCLUDED.settings,
            tools = EXCLUDED.tools,
            "rootRunId" = EXCLUDED."rootRunId"
        """

        params = {
            "id": step_dict["id"],
            "thread_id": step_dict.get("threadId"),
            "parent_id": step_dict.get("parentId"),
            "input": json.dumps(step_dict.get("input", {})),
            "metadata": json.dumps(step_dict.get("metadata", {})),
            "name": step_dict.get("name"),
            "output": json.dumps(step_dict.get("output", {})),
            "type": step_dict["type"],
            "start_time": now,  # step_dict.get("start") or now,
            "end_time": now,  # step_dict.get("end") or now,
            "variables": json.dumps(step_dict.get("variables", {})),
            "settings": json.dumps(step_dict.get("settings", {})),
            "tools": json.dumps(step_dict.get("tools", {})),
            "root_run_id": step_dict.get("rootRunId"),
        }
        await self.execute_query(query, params)

    @queue_until_user_message()
    async def update_step(self, step_dict: StepDict):
        query = """
        UPDATE "Step" SET
            output = :output,
            "endTime" = :end_time
        WHERE id = :id
        """
        now = await self.get_current_timestamp()
        params = {
            "id": step_dict["id"],
            "output": json.dumps(step_dict.get("output", {})),
            "end_time": now,
        }
        await self.execute_query(query, params)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        # Delete associated attachments and scores first
        await self.execute_query(
            'DELETE FROM "Attachment" WHERE "stepId" = :step_id', {"step_id": step_id}
        )
        await self.execute_query(
            'DELETE FROM "Score" WHERE "stepId" = :step_id', {"step_id": step_id}
        )
        # Delete the step
        await self.execute_query(
            'DELETE FROM "Step" WHERE id = :step_id', {"step_id": step_id}
        )

    async def get_thread_author(self, thread_id: str) -> str:
        query = """
        SELECT p.identifier 
        FROM "Thread" t
        JOIN "Participant" p ON t."participantId" = p.id
        WHERE t.id = :thread_id
        """
        result = await self.execute_query(query, {"thread_id": thread_id})
        row = result.first()
        if not row:
            raise ValueError(f"Thread {thread_id} not found")
        return row.identifier

    async def delete_thread(self, thread_id: str):
        # Cascade delete will handle related records
        await self.execute_query(
            'DELETE FROM "Thread" WHERE id = :thread_id', {"thread_id": thread_id}
        )

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse[ThreadDict]:
        query = """
        SELECT 
            t.*, 
            p.identifier as participant_identifier,
            (SELECT COUNT(*) FROM "Thread" WHERE "participantId" = t."participantId") as total
        FROM "Thread" t
        LEFT JOIN "Participant" p ON t."participantId" = p.id
        WHERE t."deletedAt" IS NULL
        """
        params = {}

        if filters.userId:
            query += ' AND t."participantId" = :user_id'
            params["user_id"] = filters.userId

        if pagination.cursor:
            query += ' AND t."createdAt" < (SELECT "createdAt" FROM "Thread" WHERE id = :cursor)'
            params["cursor"] = pagination.cursor

        query += ' ORDER BY t."createdAt" DESC LIMIT :limit'
        params["limit"] = str(pagination.first + 1)

        result = await self.execute_query(query, params)
        threads = result.fetchall()

        has_next_page = len(threads) > pagination.first
        if has_next_page:
            threads = threads[:-1]

        thread_dicts = []
        for thread in threads:
            thread_dict = ThreadDict(
                id=str(thread.id),
                createdAt=thread.createdAt.isoformat(),
                name=thread.name,
                userId=str(thread.participantId) if thread.participantId else None,
                userIdentifier=thread.participant_identifier,
                metadata=thread.metadata,
                steps=[],
                elements=[],
                tags=[],
            )
            thread_dicts.append(thread_dict)

        return PaginatedResponse(
            pageInfo=PageInfo(
                hasNextPage=has_next_page,
                startCursor=thread_dicts[0]["id"] if thread_dicts else None,
                endCursor=thread_dicts[-1]["id"] if thread_dicts else None,
            ),
            data=thread_dicts,
        )

    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        query = """
        SELECT t.*, p.identifier as participant_identifier
        FROM "Thread" t
        LEFT JOIN "Participant" p ON t."participantId" = p.id
        WHERE t.id = :thread_id AND t."deletedAt" IS NULL
        """
        result = await self.execute_query(query, {"thread_id": thread_id})
        thread = result.first()

        if not thread:
            return None

        # Get steps
        steps_result = await self.execute_query(
            'SELECT * FROM "Step" WHERE "threadId" = :thread_id ORDER BY "startTime"',
            {"thread_id": thread_id},
        )

        # Get elements
        elements_result = await self.execute_query(
            'SELECT * FROM "Attachment" WHERE "threadId" = :thread_id',
            {"thread_id": thread_id},
        )

        return ThreadDict(
            id=str(thread.id),
            createdAt=thread.createdAt.isoformat(),
            name=thread.name,
            userId=str(thread.participantId) if thread.participantId else None,
            userIdentifier=thread.participant_identifier,
            metadata=thread.metadata,
            steps=[self._convert_step_row_to_dict(step) for step in steps_result],
            elements=[
                self._convert_element_row_to_dict(elem) for elem in elements_result
            ],
            tags=[],
        )

    async def _get_user_identifer_by_id(self, user_id: str) -> str:
        if self.show_logger:
            logger.info(f"SQLAlchemy: _get_user_identifer_by_id, user_id={user_id}")
        query = "SELECT identifier FROM users WHERE id = :user_id"
        parameters = {"user_id": user_id}
        result = await self.execute_query(query=query, params=parameters)

        assert result
        assert isinstance(result, list)

        return result[0]["identifier"]

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        if self.show_logger:
            logger.info(f"SQLAlchemy: update_thread, thread_id={thread_id}")

        user_identifier = None
        if user_id:
            user_identifier = await self._get_user_identifer_by_id(user_id)

        data = {
            "id": thread_id,
            "createdAt": (
                await self.get_current_timestamp() if metadata is None else None
            ),
            "name": (
                name
                if name is not None
                else (metadata.get("name") if metadata and "name" in metadata else None)
            ),
            "userId": user_id,
            "userIdentifier": user_identifier,
            "tags": tags,
            "metadata": json.dumps(metadata or {}),
        }
        parameters = {
            key: value for key, value in data.items() if value is not None
        }  # Remove keys with None values
        columns = ", ".join(f'"{key}"' for key in parameters.keys())
        values = ", ".join(f":{key}" for key in parameters.keys())
        updates = ", ".join(
            f'"{key}" = EXCLUDED."{key}"' for key in parameters.keys() if key != "id"
        )
        query = f"""
            INSERT INTO "Thread" ({columns})
            VALUES ({values})
            ON CONFLICT ("id") DO UPDATE
            SET {updates};
        """
        await self.execute_query(query=query, params=parameters)

    def _convert_step_row_to_dict(self, row) -> StepDict:
        return StepDict(
            id=str(row.id),
            threadId=str(row.get("threadId")),
            parentId=str(row.parentId) if row.parentId else None,
            name=row.name,
            type=row.type,
            input=row.input,
            output=row.output,
            metadata=row.metadata,
            start=row.startTime.isoformat() if row.startTime else None,
            end=row.endTime.isoformat() if row.endTime else None,
        )

    def _convert_element_row_to_dict(self, row) -> ElementDict:
        return ElementDict(
            id=str(row.id),
            threadId=str(row.get("threadId")),
            type="file",
            url=row.url,
            name=row.name,
            mime=row.mime,
            objectKey=row.objectKey,
            forId=str(row.stepId),
            chainlitKey=row.get("chainlitKey"),
            display=row["display"],
            size=row["size"],
            language=row["language"],
            page=row["page"],
            autoPlay=row.get("autoPlay"),
            playerConfig=row.get("playerConfig"),
        )

    async def build_debug_url(self) -> str:
        return ""
