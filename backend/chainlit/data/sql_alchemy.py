import json
import ssl
import uuid
from dataclasses import asdict
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

import aiofiles
import aiohttp
from chainlit.context import context
from chainlit.data.base import BaseDataLayer, BaseStorageClient
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
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

if TYPE_CHECKING:
    from chainlit.element import Element, ElementDict
    from chainlit.step import StepDict


class SQLAlchemyDataLayer(BaseDataLayer):
    def __init__(
        self,
        conninfo: str,
        ssl_require: bool = False,
        storage_provider: Optional[BaseStorageClient] = None,
        user_thread_limit: Optional[int] = 1000,
        show_logger: Optional[bool] = False,
    ):
        self._conninfo = conninfo
        self.user_thread_limit = user_thread_limit
        self.show_logger = show_logger
        ssl_args = {}
        if ssl_require:
            # Create an SSL context to require an SSL connection
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            ssl_args["ssl"] = ssl_context
        self.engine: AsyncEngine = create_async_engine(
            self._conninfo, connect_args=ssl_args
        )
        self.async_session = sessionmaker(
            bind=self.engine, expire_on_commit=False, class_=AsyncSession
        )  # type: ignore
        if storage_provider:
            self.storage_provider: Optional[BaseStorageClient] = storage_provider
            if self.show_logger:
                logger.info("SQLAlchemyDataLayer storage client initialized")
        else:
            self.storage_provider = None
            logger.warn(
                "SQLAlchemyDataLayer storage client is not initialized and elements will not be persisted!"
            )

    async def build_debug_url(self) -> str:
        return ""

    ###### SQL Helpers ######
    async def execute_sql(
        self, query: str, parameters: dict
    ) -> Union[List[Dict[str, Any]], int, None]:
        parameterized_query = text(query)
        async with self.async_session() as session:
            try:
                await session.begin()
                result = await session.execute(parameterized_query, parameters)
                await session.commit()
                if result.returns_rows:
                    json_result = [dict(row._mapping) for row in result.fetchall()]
                    clean_json_result = self.clean_result(json_result)
                    return clean_json_result
                else:
                    return result.rowcount
            except SQLAlchemyError as e:
                await session.rollback()
                logger.warn(f"An error occurred: {e}")
                return None
            except Exception as e:
                await session.rollback()
                logger.warn(f"An unexpected error occurred: {e}")
                return None

    async def get_current_timestamp(self) -> str:
        return datetime.now().isoformat() + "Z"

    def clean_result(self, obj):
        """Recursively change UUID -> str and serialize dictionaries"""
        if isinstance(obj, dict):
            return {k: self.clean_result(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self.clean_result(item) for item in obj]
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        return obj

    ###### User ######
    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_user, identifier={identifier}")
        query = "SELECT * FROM users WHERE identifier = :identifier"
        parameters = {"identifier": identifier}
        result = await self.execute_sql(query=query, parameters=parameters)
        if result and isinstance(result, list):
            user_data = result[0]
            return PersistedUser(**user_data)
        return None

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: create_user, user_identifier={user.identifier}")
        existing_user: Optional["PersistedUser"] = await self.get_user(user.identifier)
        user_dict: Dict[str, Any] = {
            "identifier": str(user.identifier),
            "metadata": json.dumps(user.metadata) or {},
        }
        if not existing_user:  # create the user
            if self.show_logger:
                logger.info("SQLAlchemy: create_user, creating the user")
            user_dict["id"] = str(uuid.uuid4())
            user_dict["createdAt"] = await self.get_current_timestamp()
            query = """INSERT INTO users ("id", "identifier", "createdAt", "metadata") VALUES (:id, :identifier, :createdAt, :metadata)"""
            await self.execute_sql(query=query, parameters=user_dict)
        else:  # update the user
            if self.show_logger:
                logger.info("SQLAlchemy: update user metadata")
            query = """UPDATE users SET "metadata" = :metadata WHERE "identifier" = :identifier"""
            await self.execute_sql(
                query=query, parameters=user_dict
            )  # We want to update the metadata
        return await self.get_user(user.identifier)

    ###### Threads ######
    async def get_thread_author(self, thread_id: str) -> str:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_thread_author, thread_id={thread_id}")
        query = """SELECT "userIdentifier" FROM threads WHERE "id" = :id"""
        parameters = {"id": thread_id}
        result = await self.execute_sql(query=query, parameters=parameters)
        if isinstance(result, list) and result:
            author_identifier = result[0].get("userIdentifier")
            if author_identifier is not None:
                return author_identifier
        raise ValueError(f"Author not found for thread_id {thread_id}")

    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_thread, thread_id={thread_id}")
        user_threads: Optional[List[ThreadDict]] = await self.get_all_user_threads(
            thread_id=thread_id
        )
        if user_threads:
            return user_threads[0]
        else:
            return None

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
        if context.session.user is not None:
            user_identifier = context.session.user.identifier
        else:
            raise ValueError("User not found in session context")
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
            "metadata": json.dumps(metadata) if metadata else None,
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
            INSERT INTO threads ({columns})
            VALUES ({values})
            ON CONFLICT ("id") DO UPDATE
            SET {updates};
        """
        await self.execute_sql(query=query, parameters=parameters)

    async def delete_thread(self, thread_id: str):
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_thread, thread_id={thread_id}")
        # Delete feedbacks/elements/steps/thread
        feedbacks_query = """DELETE FROM feedbacks WHERE "forId" IN (SELECT "id" FROM steps WHERE "threadId" = :id)"""
        elements_query = """DELETE FROM elements WHERE "threadId" = :id"""
        steps_query = """DELETE FROM steps WHERE "threadId" = :id"""
        thread_query = """DELETE FROM threads WHERE "id" = :id"""
        parameters = {"id": thread_id}
        await self.execute_sql(query=feedbacks_query, parameters=parameters)
        await self.execute_sql(query=elements_query, parameters=parameters)
        await self.execute_sql(query=steps_query, parameters=parameters)
        await self.execute_sql(query=thread_query, parameters=parameters)

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse:
        if self.show_logger:
            logger.info(
                f"SQLAlchemy: list_threads, pagination={pagination}, filters={filters}"
            )
        if not filters.userId:
            raise ValueError("userId is required")
        all_user_threads: List[ThreadDict] = (
            await self.get_all_user_threads(user_id=filters.userId) or []
        )

        search_keyword = filters.search.lower() if filters.search else None
        feedback_value = int(filters.feedback) if filters.feedback else None

        filtered_threads = []
        for thread in all_user_threads:
            keyword_match = True
            feedback_match = True
            if search_keyword or feedback_value is not None:
                if search_keyword:
                    keyword_match = any(
                        search_keyword in step["output"].lower()
                        for step in thread["steps"]
                        if "output" in step
                    )
                if feedback_value is not None:
                    feedback_match = False  # Assume no match until found
                    for step in thread["steps"]:
                        feedback = step.get("feedback")
                        if feedback and feedback.get("value") == feedback_value:
                            feedback_match = True
                            break
            if keyword_match and feedback_match:
                filtered_threads.append(thread)

        start = 0
        if pagination.cursor:
            for i, thread in enumerate(filtered_threads):
                if (
                    thread["id"] == pagination.cursor
                ):  # Find the start index using pagination.cursor
                    start = i + 1
                    break
        end = start + pagination.first
        paginated_threads = filtered_threads[start:end] or []

        has_next_page = len(filtered_threads) > end
        start_cursor = paginated_threads[0]["id"] if paginated_threads else None
        end_cursor = paginated_threads[-1]["id"] if paginated_threads else None

        return PaginatedResponse(
            pageInfo=PageInfo(
                hasNextPage=has_next_page,
                startCursor=start_cursor,
                endCursor=end_cursor,
            ),
            data=paginated_threads,
        )

    ###### Steps ######
    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        if self.show_logger:
            logger.info(f"SQLAlchemy: create_step, step_id={step_dict.get('id')}")
        if not getattr(context.session.user, "id", None):
            raise ValueError("No authenticated user in context")
        step_dict["showInput"] = (
            str(step_dict.get("showInput", "")).lower()
            if "showInput" in step_dict
            else None
        )
        parameters = {
            key: value
            for key, value in step_dict.items()
            if value is not None and not (isinstance(value, dict) and not value)
        }
        parameters["metadata"] = json.dumps(step_dict.get("metadata", {}))
        parameters["generation"] = json.dumps(step_dict.get("generation", {}))
        columns = ", ".join(f'"{key}"' for key in parameters.keys())
        values = ", ".join(f":{key}" for key in parameters.keys())
        updates = ", ".join(
            f'"{key}" = :{key}' for key in parameters.keys() if key != "id"
        )
        query = f"""
            INSERT INTO steps ({columns})
            VALUES ({values})
            ON CONFLICT (id) DO UPDATE
            SET {updates};
        """
        await self.execute_sql(query=query, parameters=parameters)

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        if self.show_logger:
            logger.info(f"SQLAlchemy: update_step, step_id={step_dict.get('id')}")
        await self.create_step(step_dict)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_step, step_id={step_id}")
        # Delete feedbacks/elements/steps
        feedbacks_query = """DELETE FROM feedbacks WHERE "forId" = :id"""
        elements_query = """DELETE FROM elements WHERE "forId" = :id"""
        steps_query = """DELETE FROM steps WHERE "id" = :id"""
        parameters = {"id": step_id}
        await self.execute_sql(query=feedbacks_query, parameters=parameters)
        await self.execute_sql(query=elements_query, parameters=parameters)
        await self.execute_sql(query=steps_query, parameters=parameters)

    ###### Feedback ######
    async def upsert_feedback(self, feedback: Feedback) -> str:
        if self.show_logger:
            logger.info(f"SQLAlchemy: upsert_feedback, feedback_id={feedback.id}")
        feedback.id = feedback.id or str(uuid.uuid4())
        feedback_dict = asdict(feedback)
        parameters = {
            key: value for key, value in feedback_dict.items() if value is not None
        }

        columns = ", ".join(f'"{key}"' for key in parameters.keys())
        values = ", ".join(f":{key}" for key in parameters.keys())
        updates = ", ".join(
            f'"{key}" = :{key}' for key in parameters.keys() if key != "id"
        )
        query = f"""
            INSERT INTO feedbacks ({columns})
            VALUES ({values})
            ON CONFLICT (id) DO UPDATE
            SET {updates};
        """
        await self.execute_sql(query=query, parameters=parameters)
        return feedback.id

    async def delete_feedback(self, feedback_id: str) -> bool:
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_feedback, feedback_id={feedback_id}")
        query = """DELETE FROM feedbacks WHERE "id" = :feedback_id"""
        parameters = {"feedback_id": feedback_id}
        await self.execute_sql(query=query, parameters=parameters)
        return True

    ###### Elements ######
    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        if self.show_logger:
            logger.info(f"SQLAlchemy: create_element, element_id = {element.id}")
        if not getattr(context.session.user, "id", None):
            raise ValueError("No authenticated user in context")
        if not self.storage_provider:
            logger.warn(
                "SQLAlchemy: create_element error. No blob_storage_client is configured!"
            )
            return
        if not element.for_id:
            return

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

        context_user = context.session.user

        user_folder = getattr(context_user, "id", "unknown")
        file_object_key = f"{user_folder}/{element.id}" + (
            f"/{element.name}" if element.name else ""
        )

        if not element.mime:
            element.mime = "application/octet-stream"

        uploaded_file = await self.storage_provider.upload_file(
            object_key=file_object_key, data=content, mime=element.mime, overwrite=True
        )
        if not uploaded_file:
            raise ValueError(
                "SQLAlchemy Error: create_element, Failed to persist data in storage_provider"
            )

        element_dict: ElementDict = element.to_dict()

        element_dict["url"] = uploaded_file.get("url")
        element_dict["objectKey"] = uploaded_file.get("object_key")
        element_dict_cleaned = {k: v for k, v in element_dict.items() if v is not None}

        columns = ", ".join(f'"{column}"' for column in element_dict_cleaned.keys())
        placeholders = ", ".join(f":{column}" for column in element_dict_cleaned.keys())
        query = f"INSERT INTO elements ({columns}) VALUES ({placeholders})"
        await self.execute_sql(query=query, parameters=element_dict_cleaned)

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_element, element_id={element_id}")
        query = """DELETE FROM elements WHERE "id" = :id"""
        parameters = {"id": element_id}
        await self.execute_sql(query=query, parameters=parameters)

    async def get_all_user_threads(
        self, user_id: Optional[str] = None, thread_id: Optional[str] = None
    ) -> Optional[List[ThreadDict]]:
        """Fetch all user threads up to self.user_thread_limit, or one thread by id if thread_id is provided."""
        if self.show_logger:
            logger.info("SQLAlchemy: get_all_user_threads")
        user_threads_query = """
            SELECT
                "id" AS thread_id,
                "createdAt" AS thread_createdat,
                "name" AS thread_name,
                "userId" AS user_id,
                "userIdentifier" AS user_identifier,
                "tags" AS thread_tags,
                "metadata" AS thread_metadata
            FROM threads
            WHERE "userId" = :user_id OR "id" = :thread_id
            ORDER BY "createdAt" DESC
            LIMIT :limit
        """
        user_threads = await self.execute_sql(
            query=user_threads_query,
            parameters={
                "user_id": user_id,
                "limit": self.user_thread_limit,
                "thread_id": thread_id,
            },
        )
        if not isinstance(user_threads, list):
            return None
        if not user_threads:
            return []
        else:
            thread_ids = (
                "('"
                + "','".join(map(str, [thread["thread_id"] for thread in user_threads]))
                + "')"
            )

        steps_feedbacks_query = f"""
            SELECT
                s."id" AS step_id,
                s."name" AS step_name,
                s."type" AS step_type,
                s."threadId" AS step_threadid,
                s."parentId" AS step_parentid,
                s."streaming" AS step_streaming,
                s."waitForAnswer" AS step_waitforanswer,
                s."isError" AS step_iserror,
                s."metadata" AS step_metadata,
                s."tags" AS step_tags,
                s."input" AS step_input,
                s."output" AS step_output,
                s."createdAt" AS step_createdat,
                s."start" AS step_start,
                s."end" AS step_end,
                s."generation" AS step_generation,
                s."showInput" AS step_showinput,
                s."language" AS step_language,
                s."indent" AS step_indent,
                f."value" AS feedback_value,
                f."comment" AS feedback_comment,
                f."id" AS feedback_id
            FROM steps s LEFT JOIN feedbacks f ON s."id" = f."forId"
            WHERE s."threadId" IN {thread_ids}
            ORDER BY s."createdAt" ASC
        """
        steps_feedbacks = await self.execute_sql(
            query=steps_feedbacks_query, parameters={}
        )

        elements_query = f"""
            SELECT
                e."id" AS element_id,
                e."threadId" as element_threadid,
                e."type" AS element_type,
                e."chainlitKey" AS element_chainlitkey,
                e."url" AS element_url,
                e."objectKey" as element_objectkey,
                e."name" AS element_name,
                e."display" AS element_display,
                e."size" AS element_size,
                e."language" AS element_language,
                e."page" AS element_page,
                e."forId" AS element_forid,
                e."mime" AS element_mime
            FROM elements e
            WHERE e."threadId" IN {thread_ids}
        """
        elements = await self.execute_sql(query=elements_query, parameters={})

        thread_dicts = {}
        for thread in user_threads:
            thread_id = thread["thread_id"]
            if thread_id is not None:
                thread_dicts[thread_id] = ThreadDict(
                    id=thread_id,
                    createdAt=thread["thread_createdat"],
                    name=thread["thread_name"],
                    userId=thread["user_id"],
                    userIdentifier=thread["user_identifier"],
                    tags=thread["thread_tags"],
                    metadata=thread["thread_metadata"],
                    steps=[],
                    elements=[],
                )
        # Process steps_feedbacks to populate the steps in the corresponding ThreadDict
        if isinstance(steps_feedbacks, list):
            for step_feedback in steps_feedbacks:
                thread_id = step_feedback["step_threadid"]
                if thread_id is not None:
                    feedback = None
                    if step_feedback["feedback_value"] is not None:
                        feedback = FeedbackDict(
                            forId=step_feedback["step_id"],
                            id=step_feedback.get("feedback_id"),
                            value=step_feedback["feedback_value"],
                            comment=step_feedback.get("feedback_comment"),
                        )
                    step_dict = StepDict(
                        id=step_feedback["step_id"],
                        name=step_feedback["step_name"],
                        type=step_feedback["step_type"],
                        threadId=thread_id,
                        parentId=step_feedback.get("step_parentid"),
                        streaming=step_feedback.get("step_streaming", False),
                        waitForAnswer=step_feedback.get("step_waitforanswer"),
                        isError=step_feedback.get("step_iserror"),
                        metadata=(
                            step_feedback["step_metadata"]
                            if step_feedback.get("step_metadata") is not None
                            else {}
                        ),
                        tags=step_feedback.get("step_tags"),
                        input=(
                            step_feedback.get("step_input", "")
                            if step_feedback.get("step_showinput") not in [None, "false"]
                            else None
                        ),
                        output=step_feedback.get("step_output", ""),
                        createdAt=step_feedback.get("step_createdat"),
                        start=step_feedback.get("step_start"),
                        end=step_feedback.get("step_end"),
                        generation=step_feedback.get("step_generation"),
                        showInput=step_feedback.get("step_showinput"),
                        language=step_feedback.get("step_language"),
                        indent=step_feedback.get("step_indent"),
                        feedback=feedback,
                    )
                    # Append the step to the steps list of the corresponding ThreadDict
                    thread_dicts[thread_id]["steps"].append(step_dict)

        if isinstance(elements, list):
            for element in elements:
                thread_id = element["element_threadid"]
                if thread_id is not None:
                    element_dict = ElementDict(
                        id=element["element_id"],
                        threadId=thread_id,
                        type=element["element_type"],
                        chainlitKey=element.get("element_chainlitkey"),
                        url=element.get("element_url"),
                        objectKey=element.get("element_objectkey"),
                        name=element["element_name"],
                        display=element["element_display"],
                        size=element.get("element_size"),
                        language=element.get("element_language"),
                        autoPlay=element.get("element_autoPlay"),
                        playerConfig=element.get("element_playerconfig"),
                        page=element.get("element_page"),
                        forId=element.get("element_forid"),
                        mime=element.get("element_mime"),
                    )
                    thread_dicts[thread_id]["elements"].append(element_dict)  # type: ignore

        return list(thread_dicts.values())
