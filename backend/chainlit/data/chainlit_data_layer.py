import asyncio
import atexit
import json
import signal
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

import aiofiles
import asyncpg  # type: ignore

from chainlit.data.base import BaseDataLayer
from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.data.utils import queue_until_user_message
from chainlit.element import ElementDict
from chainlit.logger import logger
from chainlit.step import StepDict
from chainlit.types import (
    Feedback,
    FeedbackDict,
    PageInfo,
    PaginatedResponse,
    Pagination,
    ThreadDict,
    ThreadFilter,
)
from chainlit.user import PersistedUser, User

if TYPE_CHECKING:
    from chainlit.data.storage_clients.gcs import GCSStorageClient
    from chainlit.element import Element, ElementDict
    from chainlit.step import StepDict

ISO_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"


class ChainlitDataLayer(BaseDataLayer):
    def __init__(
        self,
        database_url: str,
        storage_client: Optional[BaseStorageClient] = None,
        show_logger: bool = False,
    ):
        self.database_url = database_url
        self.pool: Optional[asyncpg.Pool] = None
        self.storage_client = storage_client
        self.show_logger = show_logger

        # Register cleanup handlers for application termination
        atexit.register(self._sync_cleanup)
        for sig in (signal.SIGINT, signal.SIGTERM):
            signal.signal(sig, self._signal_handler)

    async def connect(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.database_url)

    async def get_current_timestamp(self) -> datetime:
        return datetime.now()

    async def execute_query(
        self, query: str, params: Union[Dict, None] = None
    ) -> List[Dict[str, Any]]:
        if not self.pool:
            await self.connect()

        try:
            async with self.pool.acquire() as connection:  # type: ignore
                try:
                    if params:
                        records = await connection.fetch(query, *params.values())
                    else:
                        records = await connection.fetch(query)
                    return [dict(record) for record in records]
                except Exception as e:
                    logger.error(f"Database error: {e!s}")
                    raise
        except (
            asyncpg.exceptions.ConnectionDoesNotExistError,
            asyncpg.exceptions.InterfaceError,
        ) as e:
            # Handle connection issues by cleaning up and rethrowing
            logger.error(f"Connection error: {e!s}, cleaning up pool")
            await self.cleanup()
            self.pool = None
            raise

    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        query = """
        SELECT * FROM "User" 
        WHERE identifier = $1
        """
        result = await self.execute_query(query, {"identifier": identifier})
        if not result or len(result) == 0:
            return None
        row = result[0]

        return PersistedUser(
            id=str(row.get("id")),
            identifier=str(row.get("identifier")),
            createdAt=row.get("createdAt").isoformat(),  # type: ignore
            metadata=json.loads(row.get("metadata", "{}")),
        )

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        query = """
        INSERT INTO "User" (id, identifier, metadata, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (identifier) DO UPDATE
        SET metadata = $3
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
        row = result[0]

        return PersistedUser(
            id=str(row.get("id")),
            identifier=str(row.get("identifier")),
            createdAt=row.get("createdAt").isoformat(),  # type: ignore
            metadata=json.loads(row.get("metadata", "{}")),
        )

    async def delete_feedback(self, feedback_id: str) -> bool:
        query = """
        DELETE FROM "Feedback" WHERE id = $1
        """
        await self.execute_query(query, {"feedback_id": feedback_id})
        return True

    async def upsert_feedback(self, feedback: Feedback) -> str:
        query = """
        INSERT INTO "Feedback" (id, "stepId", name, value, comment)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
        SET value = $4, comment = $5
        RETURNING id
        """
        feedback_id = feedback.id or str(uuid.uuid4())
        params = {
            "id": feedback_id,
            "step_id": feedback.forId,
            "name": "user_feedback",
            "value": float(feedback.value),
            "comment": feedback.comment,
        }
        results = await self.execute_query(query, params)
        return str(results[0]["id"])

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        if not self.storage_client:
            logger.warning(
                "Data Layer: create_element error. No cloud storage configured!"
            )
            return

        if not element.for_id:
            return

        if element.thread_id:
            query = 'SELECT id FROM "Thread" WHERE id = $1'
            results = await self.execute_query(query, {"thread_id": element.thread_id})
            if not results:
                await self.update_thread(thread_id=element.thread_id)

        if element.for_id:
            query = 'SELECT id FROM "Step" WHERE id = $1'
            results = await self.execute_query(query, {"step_id": element.for_id})
            if not results:
                await self.create_step(
                    {
                        "id": element.for_id,
                        "metadata": {},
                        "type": "run",
                        "start_time": await self.get_current_timestamp(),
                        "end_time": await self.get_current_timestamp(),
                    }
                )
        content: Optional[Union[bytes, str]] = None

        if element.path:
            async with aiofiles.open(element.path, "rb") as f:
                content = await f.read()
        elif element.content:
            content = element.content
        elif not element.url:
            raise ValueError("Element url, path or content must be provided")

        if element.thread_id:
            path = f"threads/{element.thread_id}/files/{element.id}"
        else:
            path = f"files/{element.id}"

        if content is not None:
            content_disposition = (
                f'attachment; filename="{element.name}"'
                if not isinstance(self.storage_client, GCSStorageClient)
                else None
            )
            await self.storage_client.upload_file(
                object_key=path,
                data=content,
                mime=element.mime or "application/octet-stream",
                overwrite=True,
                content_disposition=content_disposition,
            )

        query = """
        INSERT INTO "Element" (
            id, "threadId", "stepId", metadata, mime, name, "objectKey", url,
            "chainlitKey", display, size, language, page, props
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (id) DO UPDATE SET
            props = EXCLUDED.props
        """
        params = {
            "id": element.id,
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
            "name": element.name,
            "object_key": path,
            "url": element.url,
            "chainlit_key": element.chainlit_key,
            "display": element.display,
            "size": element.size,
            "language": element.language,
            "page": getattr(element, "page", None),
            "props": json.dumps(getattr(element, "props", {})),
        }
        await self.execute_query(query, params)

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional[ElementDict]:
        query = """
        SELECT * FROM "Element"
        WHERE id = $1 AND "threadId" = $2
        """
        results = await self.execute_query(
            query, {"element_id": element_id, "thread_id": thread_id}
        )

        if not results:
            return None

        row = results[0]
        metadata = json.loads(row.get("metadata", "{}"))

        return ElementDict(
            id=str(row["id"]),
            threadId=str(row["threadId"]),
            type=metadata.get("type", "file"),
            url=str(row["url"]),
            name=str(row["name"]),
            mime=str(row["mime"]),
            objectKey=str(row["objectKey"]),
            forId=str(row["stepId"]),
            chainlitKey=row.get("chainlitKey"),
            display=row["display"],
            size=row["size"],
            language=row["language"],
            page=row["page"],
            autoPlay=row.get("autoPlay"),
            playerConfig=row.get("playerConfig"),
            props=json.loads(row.get("props", "{}")),
        )

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        query = """
        SELECT * FROM "Element"
        WHERE id = $1
        """
        elements = await self.execute_query(query, {"id": element_id})

        if self.storage_client is not None and len(elements) > 0:
            if elements[0]["objectKey"]:
                await self.storage_client.delete_file(
                    object_key=elements[0]["objectKey"]
                )
        query = """
        DELETE FROM "Element" 
        WHERE id = $1
        """
        params = {"id": element_id}

        if thread_id:
            query += ' AND "threadId" = $2'
            params["thread_id"] = thread_id

        await self.execute_query(query, params)

    @queue_until_user_message()
    async def create_step(self, step_dict: StepDict):
        if step_dict.get("threadId"):
            thread_query = 'SELECT id FROM "Thread" WHERE id = $1'
            thread_results = await self.execute_query(
                thread_query, {"thread_id": step_dict["threadId"]}
            )
            if not thread_results:
                await self.update_thread(thread_id=step_dict["threadId"])

        if step_dict.get("parentId"):
            parent_query = 'SELECT id FROM "Step" WHERE id = $1'
            parent_results = await self.execute_query(
                parent_query, {"parent_id": step_dict["parentId"]}
            )
            if not parent_results:
                await self.create_step(
                    {
                        "id": step_dict["parentId"],
                        "metadata": {},
                        "type": "run",
                        "createdAt": step_dict.get("createdAt"),
                    }
                )

        query = """
        INSERT INTO "Step" (
            id, "threadId", "parentId", input, metadata, name, output,
            type, "startTime", "endTime", "showInput", "isError"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (id) DO UPDATE SET
            "parentId" = COALESCE(EXCLUDED."parentId", "Step"."parentId"),
            input = COALESCE(EXCLUDED.input, "Step".input),
            metadata = CASE 
                WHEN EXCLUDED.metadata <> '{}' THEN EXCLUDED.metadata 
                ELSE "Step".metadata 
            END,
            name = COALESCE(EXCLUDED.name, "Step".name),
            output = COALESCE(EXCLUDED.output, "Step".output),
            type = CASE 
                WHEN EXCLUDED.type = 'run' THEN "Step".type 
                ELSE EXCLUDED.type 
            END,
            "threadId" = COALESCE(EXCLUDED."threadId", "Step"."threadId"),
            "endTime" = COALESCE(EXCLUDED."endTime", "Step"."endTime"),
            "startTime" = LEAST(EXCLUDED."startTime", "Step"."startTime"),
            "showInput" = COALESCE(EXCLUDED."showInput", "Step"."showInput"),
            "isError" = COALESCE(EXCLUDED."isError", "Step"."isError")
        """

        timestamp = await self.get_current_timestamp()
        created_at = step_dict.get("createdAt")
        if created_at:
            timestamp = datetime.strptime(created_at, ISO_FORMAT)

        params = {
            "id": step_dict["id"],
            "thread_id": step_dict.get("threadId"),
            "parent_id": step_dict.get("parentId"),
            "input": step_dict.get("input"),
            "metadata": json.dumps(step_dict.get("metadata", {})),
            "name": step_dict.get("name"),
            "output": step_dict.get("output"),
            "type": step_dict["type"],
            "start_time": timestamp,
            "end_time": timestamp,
            "show_input": str(step_dict.get("showInput", "json")),
            "is_error": step_dict.get("isError", False),
        }
        await self.execute_query(query, params)

    @queue_until_user_message()
    async def update_step(self, step_dict: StepDict):
        await self.create_step(step_dict)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        # Delete associated elements and feedbacks first
        await self.execute_query(
            'DELETE FROM "Element" WHERE "stepId" = $1', {"step_id": step_id}
        )
        await self.execute_query(
            'DELETE FROM "Feedback" WHERE "stepId" = $1', {"step_id": step_id}
        )
        # Delete the step
        await self.execute_query(
            'DELETE FROM "Step" WHERE id = $1', {"step_id": step_id}
        )

    async def get_thread_author(self, thread_id: str) -> str:
        query = """
        SELECT u.identifier 
        FROM "Thread" t
        JOIN "User" u ON t."userId" = u.id
        WHERE t.id = $1
        """
        results = await self.execute_query(query, {"thread_id": thread_id})
        if not results:
            raise ValueError(f"Thread {thread_id} not found")
        return results[0]["identifier"]

    async def delete_thread(self, thread_id: str):
        elements_query = """
        SELECT * FROM "Element" 
        WHERE "threadId" = $1
        """
        elements_results = await self.execute_query(
            elements_query, {"thread_id": thread_id}
        )

        if self.storage_client is not None:
            for elem in elements_results:
                if elem["objectKey"]:
                    await self.storage_client.delete_file(object_key=elem["objectKey"])

        await self.execute_query(
            'DELETE FROM "Thread" WHERE id = $1', {"thread_id": thread_id}
        )

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse[ThreadDict]:
        query = """
        SELECT 
            t.*, 
            u.identifier as user_identifier,
            (SELECT COUNT(*) FROM "Thread" WHERE "userId" = t."userId") as total
        FROM "Thread" t
        LEFT JOIN "User" u ON t."userId" = u.id
        WHERE t."deletedAt" IS NULL
        """
        params: Dict[str, Any] = {}
        param_count = 1

        if filters.search:
            query += f" AND t.name ILIKE ${param_count}"
            params["name"] = f"%{filters.search}%"
            param_count += 1

        if filters.userId:
            query += f' AND t."userId" = ${param_count}'
            params["user_id"] = filters.userId
            param_count += 1

        if pagination.cursor:
            query += f' AND t."updatedAt" < (SELECT "updatedAt" FROM "Thread" WHERE id = ${param_count})'
            params["cursor"] = pagination.cursor
            param_count += 1

        query += f' ORDER BY t."updatedAt" DESC LIMIT ${param_count}'
        params["limit"] = pagination.first + 1

        results = await self.execute_query(query, params)
        threads = results

        has_next_page = len(threads) > pagination.first
        if has_next_page:
            threads = threads[:-1]

        thread_dicts = []
        for thread in threads:
            thread_dict = ThreadDict(
                id=str(thread["id"]),
                createdAt=thread["createdAt"].isoformat(),
                name=thread["name"],
                userId=str(thread["userId"]) if thread["userId"] else None,
                userIdentifier=thread["user_identifier"],
                metadata=json.loads(thread["metadata"]),
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
        SELECT t.*, u.identifier as user_identifier
        FROM "Thread" t
        LEFT JOIN "User" u ON t."userId" = u.id
        WHERE t.id = $1 AND t."deletedAt" IS NULL
        """
        results = await self.execute_query(query, {"thread_id": thread_id})

        if not results:
            return None

        thread = results[0]

        # Get steps and related feedback
        steps_query = """
        SELECT  s.*, 
                f.id feedback_id, 
                f.value feedback_value, 
                f."comment" feedback_comment
        FROM "Step" s left join "Feedback" f on s.id = f."stepId"
        WHERE s."threadId" = $1
        ORDER BY "startTime"
        """
        steps_results = await self.execute_query(steps_query, {"thread_id": thread_id})

        # Get elements
        elements_query = """
        SELECT * FROM "Element" 
        WHERE "threadId" = $1
        """
        elements_results = await self.execute_query(
            elements_query, {"thread_id": thread_id}
        )

        if self.storage_client is not None:
            for elem in elements_results:
                if not elem["url"] and elem["objectKey"]:
                    elem["url"] = await self.storage_client.get_read_url(
                        object_key=elem["objectKey"],
                    )

        return ThreadDict(
            id=str(thread["id"]),
            createdAt=thread["createdAt"].isoformat(),
            name=thread["name"],
            userId=str(thread["userId"]) if thread["userId"] else None,
            userIdentifier=thread["user_identifier"],
            metadata=json.loads(thread["metadata"]),
            steps=[self._convert_step_row_to_dict(step) for step in steps_results],
            elements=[
                self._convert_element_row_to_dict(elem) for elem in elements_results
            ],
            tags=[],
        )

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        if self.show_logger:
            logger.info(f"asyncpg: update_thread, thread_id={thread_id}")

        thread_name = truncate(
            name
            if name is not None
            else (metadata.get("name") if metadata and "name" in metadata else None)
        )

        data = {
            "id": thread_id,
            "name": thread_name,
            "userId": user_id,
            "tags": tags,
            "metadata": json.dumps(metadata or {}),
            "updatedAt": datetime.now(),
        }

        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        # Build the query dynamically based on available fields
        columns = [f'"{k}"' for k in data.keys()]
        placeholders = [f"${i + 1}" for i in range(len(data))]
        values = list(data.values())

        update_sets = [f'"{k}" = EXCLUDED."{k}"' for k in data.keys() if k != "id"]

        if update_sets:
            query = f"""
                INSERT INTO "Thread" ({", ".join(columns)})
                VALUES ({", ".join(placeholders)})
                ON CONFLICT (id) DO UPDATE
                SET {", ".join(update_sets)};
            """
        else:
            query = f"""
                INSERT INTO "Thread" ({", ".join(columns)})
                VALUES ({", ".join(placeholders)})
                ON CONFLICT (id) DO NOTHING
            """

        await self.execute_query(query, {str(i + 1): v for i, v in enumerate(values)})

    def _extract_feedback_dict_from_step_row(self, row: Dict) -> Optional[FeedbackDict]:
        if row["feedback_id"] is not None:
            return FeedbackDict(
                forId=row["id"],
                id=row["feedback_id"],
                value=row["feedback_value"],
                comment=row["feedback_comment"],
            )
        return None

    def _convert_step_row_to_dict(self, row: Dict) -> StepDict:
        return StepDict(
            id=str(row["id"]),
            threadId=str(row["threadId"]) if row.get("threadId") else "",
            parentId=str(row["parentId"]) if row.get("parentId") else None,
            name=str(row.get("name")),
            type=row["type"],
            input=row.get("input", {}),
            output=row.get("output", {}),
            metadata=json.loads(row.get("metadata", "{}")),
            createdAt=row["createdAt"].isoformat() if row.get("createdAt") else None,
            start=row["startTime"].isoformat() if row.get("startTime") else None,
            showInput=row.get("showInput"),
            isError=row.get("isError"),
            end=row["endTime"].isoformat() if row.get("endTime") else None,
            feedback=self._extract_feedback_dict_from_step_row(row),
        )

    def _convert_element_row_to_dict(self, row: Dict) -> ElementDict:
        metadata = json.loads(row.get("metadata", "{}"))
        return ElementDict(
            id=str(row["id"]),
            threadId=str(row["threadId"]) if row.get("threadId") else None,
            type=metadata.get("type", "file"),
            url=row["url"],
            name=row["name"],
            mime=row["mime"],
            objectKey=row["objectKey"],
            forId=str(row["stepId"]),
            chainlitKey=row.get("chainlitKey"),
            display=row["display"],
            size=row["size"],
            language=row["language"],
            page=row["page"],
            autoPlay=row.get("autoPlay"),
            playerConfig=row.get("playerConfig"),
            props=json.loads(row.get("props") or "{}"),
        )

    async def build_debug_url(self) -> str:
        return ""

    async def cleanup(self):
        """Cleanup database connections"""
        if self.pool:
            await self.pool.close()

    def _sync_cleanup(self):
        """Cleanup database connections in a synchronous context."""
        if self.pool and not self.pool.is_closing():
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.cleanup())
            else:
                try:
                    cleanup_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(cleanup_loop)
                    cleanup_loop.run_until_complete(self.cleanup())
                    cleanup_loop.close()
                except Exception as e:
                    logger.error(f"Error during sync cleanup: {e}")

    def _signal_handler(self, sig, frame):
        """Handle signals for graceful shutdown."""
        logger.info(f"Received signal {sig}, cleaning up connection pool.")
        self._sync_cleanup()
        # Re-raise the signal after cleanup
        signal.default_int_handler(sig, frame)


def truncate(text: Optional[str], max_length: int = 255) -> Optional[str]:
    return None if text is None else text[:max_length]
