from __future__ import annotations

import json
import ssl
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional, Union

import aiofiles
import aiohttp
from sqlalchemy import delete, func, or_, select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload, sessionmaker

from chainlit.data.base import BaseDataLayer
from chainlit.data.models import (
    Base,
    ElementModel,
    FeedbackModel,
    StepModel,
    ThreadModel,
    UserModel,
)
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
    from chainlit.element import Element


class SQLAlchemyDataLayer(BaseDataLayer):
    def __init__(
        self,
        conninfo: str,
        connect_args: Optional[dict[str, Any]] = None,
        ssl_require: bool = False,
        storage_provider: Optional[BaseStorageClient] = None,
        user_thread_limit: Optional[int] = 1000,
        show_logger: Optional[bool] = False,
        create_tables: bool = False,
    ):
        self._conninfo = conninfo
        self.user_thread_limit = user_thread_limit
        self.show_logger = show_logger
        if connect_args is None:
            connect_args = {}
        if ssl_require:
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_args["ssl"] = ssl_context
        self.engine: AsyncEngine = create_async_engine(
            self._conninfo, connect_args=connect_args
        )
        self.async_session = sessionmaker(
            bind=self.engine, expire_on_commit=False, class_=AsyncSession
        )  # type: ignore
        self._dialect_name = self.engine.dialect.name
        self._tables_created = False
        self._create_tables_on_init = create_tables

        if storage_provider:
            self.storage_provider: Optional[BaseStorageClient] = storage_provider
            if self.show_logger:
                logger.info("SQLAlchemyDataLayer storage client initialized")
        else:
            self.storage_provider = None
            logger.warning(
                "SQLAlchemyDataLayer storage client is not initialized and elements will not be persisted!"
            )

    async def _ensure_tables(self):
        if self._create_tables_on_init and not self._tables_created:
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            self._tables_created = True

    @asynccontextmanager
    async def _session(self):
        await self._ensure_tables()
        async with self.async_session() as session:
            try:
                yield session
                await session.commit()
            except SQLAlchemyError as e:
                await session.rollback()
                logger.warning(f"Database error: {e}")
                raise
            except Exception as e:
                await session.rollback()
                logger.warning(f"Unexpected error: {e}")
                raise

    def _get_upsert(
        self, model: type, values: dict[str, Any], index_elements: list[str]
    ) -> Any:
        # MySQL/MariaDB uses different upsert syntax
        if self._dialect_name in ("mysql", "mariadb"):
            stmt = mysql_insert(model).values(**values)  # type: ignore[assignment]
            update_dict = {k: v for k, v in values.items() if k not in index_elements}
            return stmt.on_duplicate_key_update(**update_dict)  # type: ignore[attr-defined]

        # PostgreSQL, SQLite, and others use on_conflict_do_update
        insert_fn = sqlite_insert if self._dialect_name == "sqlite" else pg_insert
        stmt = insert_fn(model).values(**values)  # type: ignore[assignment]
        update_dict = {k: stmt.excluded[k] for k in values if k not in index_elements}  # type: ignore[attr-defined]
        return stmt.on_conflict_do_update(  # type: ignore[attr-defined]
            index_elements=index_elements, set_=update_dict
        )

    async def build_debug_url(self) -> str:
        return ""

    async def get_current_timestamp(self) -> str:
        return datetime.now().isoformat() + "Z"

    def _parse_json(self, value: Any) -> dict:
        if value is None:
            return {}
        if isinstance(value, dict):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return {}
        return {}

    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_user, identifier={identifier}")
        async with self._session() as session:
            stmt = select(UserModel).where(UserModel.identifier == identifier)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            if not user:
                return None
            return PersistedUser(
                id=user.id,
                identifier=user.identifier,
                createdAt=user.createdAt or "",
                metadata=self._parse_json(user.metadata_),
            )

    async def _get_user_identifier_by_id(self, user_id: str) -> str:
        if self.show_logger:
            logger.info(f"SQLAlchemy: _get_user_identifier_by_id, user_id={user_id}")
        async with self._session() as session:
            stmt = select(UserModel.identifier).where(UserModel.id == user_id)
            result = await session.execute(stmt)
            identifier = result.scalar_one_or_none()
            if identifier is None:
                raise ValueError(f"User not found: {user_id}")
            return identifier

    async def _get_user_id_by_thread(self, thread_id: str) -> Optional[str]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: _get_user_id_by_thread, thread_id={thread_id}")
        async with self._session() as session:
            stmt = select(ThreadModel.userId).where(ThreadModel.id == thread_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: create_user, user_identifier={user.identifier}")
        existing_user = await self.get_user(user.identifier)
        async with self._session() as session:
            if not existing_user:
                if self.show_logger:
                    logger.info("SQLAlchemy: create_user, creating the user")
                new_user = UserModel(
                    id=str(uuid.uuid4()),
                    identifier=user.identifier,
                    metadata_=user.metadata or {},
                    createdAt=await self.get_current_timestamp(),
                )
                session.add(new_user)
            else:
                if self.show_logger:
                    logger.info("SQLAlchemy: update user metadata")
                stmt = select(UserModel).where(UserModel.identifier == user.identifier)
                result = await session.execute(stmt)
                db_user = result.scalar_one()
                db_user.metadata_ = user.metadata or {}
        return await self.get_user(user.identifier)

    async def get_thread_author(self, thread_id: str) -> str:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_thread_author, thread_id={thread_id}")
        async with self._session() as session:
            stmt = select(ThreadModel.userIdentifier).where(ThreadModel.id == thread_id)
            result = await session.execute(stmt)
            author = result.scalar_one_or_none()
            if author is None:
                raise ValueError(f"Author not found for thread_id {thread_id}")
            return author

    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_thread, thread_id={thread_id}")
        user_threads = await self.get_all_user_threads(thread_id=thread_id)
        if user_threads:
            return user_threads[0]
        return None

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        tags: Optional[list[str]] = None,
    ):
        if self.show_logger:
            logger.info(f"SQLAlchemy: update_thread, thread_id={thread_id}")

        user_identifier = None
        if user_id:
            user_identifier = await self._get_user_identifier_by_id(user_id)

        async with self._session() as session:
            stmt = select(ThreadModel).where(ThreadModel.id == thread_id)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            merged_metadata = {}
            if existing and existing.metadata_:
                merged_metadata = self._parse_json(existing.metadata_)

            if metadata is not None:
                incoming = {k: v for k, v in metadata.items() if v is not None}
                merged_metadata = {**merged_metadata, **incoming}

            name_value = name
            if name_value is None and metadata:
                name_value = metadata.get("name")

            if existing:
                if name_value is not None:
                    existing.name = name_value
                if user_id is not None:
                    existing.userId = user_id
                if user_identifier is not None:
                    existing.userIdentifier = user_identifier
                if tags is not None:
                    existing.tags = json.dumps(tags)
                if metadata is not None:
                    existing.metadata_ = merged_metadata
            else:
                new_thread = ThreadModel(
                    id=thread_id,
                    createdAt=await self.get_current_timestamp(),
                    name=name_value,
                    userId=user_id,
                    userIdentifier=user_identifier,
                    tags=json.dumps(tags) if tags else None,
                    metadata_=merged_metadata if metadata else None,
                )
                session.add(new_thread)

    async def delete_thread(self, thread_id: str):
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_thread, thread_id={thread_id}")

        async with self._session() as session:
            stmt = select(ElementModel).where(ElementModel.threadId == thread_id)
            result = await session.execute(stmt)
            elements = result.scalars().all()

            if self.storage_provider is not None:
                for elem in elements:
                    if elem.objectKey:
                        await self.storage_provider.delete_file(
                            object_key=elem.objectKey
                        )

            step_ids_stmt = select(StepModel.id).where(StepModel.threadId == thread_id)
            step_ids_result = await session.execute(step_ids_stmt)
            step_ids = [row[0] for row in step_ids_result.fetchall()]

            if step_ids:
                await session.execute(
                    delete(FeedbackModel).where(FeedbackModel.forId.in_(step_ids))
                )

            await session.execute(
                delete(ElementModel).where(ElementModel.threadId == thread_id)
            )
            await session.execute(
                delete(StepModel).where(StepModel.threadId == thread_id)
            )
            await session.execute(
                delete(ThreadModel).where(ThreadModel.id == thread_id)
            )

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse:
        if self.show_logger:
            logger.info(
                f"SQLAlchemy: list_threads, pagination={pagination}, filters={filters}"
            )
        if not filters.userId:
            raise ValueError("userId is required")
        all_user_threads: list[ThreadDict] = (
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
                    feedback_match = False
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
                if thread["id"] == pagination.cursor:
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

    @queue_until_user_message()
    async def create_step(self, step_dict: StepDict):
        await self.update_thread(step_dict["threadId"])

        if self.show_logger:
            logger.info(f"SQLAlchemy: create_step, step_id={step_dict.get('id')}")

        show_input = (
            str(step_dict.get("showInput", "")).lower()
            if "showInput" in step_dict
            else None
        )

        values = {
            "id": step_dict["id"],
            "name": step_dict.get("name", ""),
            "type": step_dict.get("type", ""),
            "threadId": step_dict["threadId"],
            "parentId": step_dict.get("parentId"),
            "streaming": step_dict.get("streaming", False),
            "waitForAnswer": step_dict.get("waitForAnswer"),
            "isError": step_dict.get("isError"),
            "metadata_": step_dict.get("metadata", {}),
            "tags": json.dumps(step_dict.get("tags"))
            if step_dict.get("tags")
            else None,
            "input": step_dict.get("input"),
            "output": step_dict.get("output"),
            "createdAt": step_dict.get("createdAt"),
            "start": step_dict.get("start"),
            "end": step_dict.get("end"),
            "generation": step_dict.get("generation", {}),
            "showInput": show_input,
            "language": step_dict.get("language"),
        }
        values = {
            k: v
            for k, v in values.items()
            if v is not None or k in ("parentId", "waitForAnswer", "isError")
        }
        if "name" not in values:
            values["name"] = ""
        if "type" not in values:
            values["type"] = ""

        async with self._session() as session:
            stmt = self._get_upsert(StepModel, values, ["id"])
            await session.execute(stmt)

    @queue_until_user_message()
    async def update_step(self, step_dict: StepDict):
        if self.show_logger:
            logger.info(f"SQLAlchemy: update_step, step_id={step_dict.get('id')}")
        await self.create_step(step_dict)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_step, step_id={step_id}")
        async with self._session() as session:
            await session.execute(
                delete(FeedbackModel).where(FeedbackModel.forId == step_id)
            )
            await session.execute(
                delete(ElementModel).where(ElementModel.forId == step_id)
            )
            await session.execute(delete(StepModel).where(StepModel.id == step_id))

    async def get_step(self, step_id: str) -> Optional[StepDict]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_step, step_id={step_id}")
        async with self._session() as session:
            stmt = (
                select(StepModel)
                .options(selectinload(StepModel.feedbacks))
                .where(StepModel.id == step_id)
            )
            result = await session.execute(stmt)
            step = result.scalar_one_or_none()
            if not step:
                return None

            feedback = None
            if step.feedbacks:
                fb = step.feedbacks[0]
                feedback = FeedbackDict(
                    forId=step.id,
                    id=fb.id,
                    value=fb.value,
                    comment=fb.comment,
                )

            return StepDict(
                id=step.id,
                name=step.name,
                type=step.type,
                threadId=step.threadId,
                parentId=step.parentId,
                streaming=step.streaming or False,
                waitForAnswer=step.waitForAnswer,
                isError=step.isError,
                metadata=self._parse_json(step.metadata_),
                tags=json.loads(step.tags) if step.tags else None,
                input=step.input if step.showInput not in (None, "false") else "",
                output=step.output or "",
                createdAt=step.createdAt,
                start=step.start,
                end=step.end,
                generation=self._parse_json(step.generation),
                showInput=step.showInput,
                language=step.language,
                feedback=feedback,
            )

    async def upsert_feedback(self, feedback: Feedback) -> str:
        if self.show_logger:
            logger.info(f"SQLAlchemy: upsert_feedback, feedback_id={feedback.id}")
        feedback_id = feedback.id or str(uuid.uuid4())

        values = {
            "id": feedback_id,
            "forId": feedback.forId,
            "threadId": feedback.threadId or "",
            "value": feedback.value,
            "comment": feedback.comment,
        }
        values = {k: v for k, v in values.items() if v is not None}

        async with self._session() as session:
            stmt = self._get_upsert(FeedbackModel, values, ["id"])
            await session.execute(stmt)
        return feedback_id

    async def delete_feedback(self, feedback_id: str) -> bool:
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_feedback, feedback_id={feedback_id}")
        async with self._session() as session:
            await session.execute(
                delete(FeedbackModel).where(FeedbackModel.id == feedback_id)
            )
        return True

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional[ElementDict]:
        if self.show_logger:
            logger.info(
                f"SQLAlchemy: get_element, thread_id={thread_id}, element_id={element_id}"
            )
        async with self._session() as session:
            stmt = select(ElementModel).where(
                ElementModel.threadId == thread_id, ElementModel.id == element_id
            )
            result = await session.execute(stmt)
            elem = result.scalar_one_or_none()
            if not elem:
                return None
            return ElementDict(
                id=elem.id,
                threadId=elem.threadId,
                type=elem.type,
                chainlitKey=elem.chainlitKey,
                url=elem.url,
                objectKey=elem.objectKey,
                name=elem.name,
                props=self._parse_json(elem.props),
                display=elem.display,
                size=elem.size,
                language=elem.language,
                page=elem.page,
                autoPlay=elem.autoPlay,
                playerConfig=elem.playerConfig,
                forId=elem.forId,
                mime=elem.mime,
            )

    @queue_until_user_message()
    async def create_element(self, element: Element):
        if self.show_logger:
            logger.info(f"SQLAlchemy: create_element, element_id = {element.id}")

        if not self.storage_provider:
            logger.warning(
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
            async with aiohttp.ClientSession() as http_session:
                async with http_session.get(element.url) as response:
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

        user_id = await self._get_user_id_by_thread(element.thread_id) or "unknown"
        file_object_key = f"{user_id}/{element.id}" + (
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

        element_dict = element.to_dict()

        values = {
            "id": element.id,
            "threadId": element.thread_id,
            "type": element.type,
            "url": uploaded_file.get("url"),
            "chainlitKey": element.chainlit_key,
            "name": element.name,
            "display": element.display,
            "objectKey": uploaded_file.get("object_key"),
            "size": element.size,
            "page": getattr(element, "page", None),
            "language": element.language,
            "forId": element.for_id,
            "mime": element.mime,
            "props": json.dumps(element_dict.get("props", {})),
            "autoPlay": element_dict.get("autoPlay"),
            "playerConfig": element_dict.get("playerConfig"),
        }
        values = {k: v for k, v in values.items() if v is not None}
        if "name" not in values:
            values["name"] = ""

        async with self._session() as session:
            stmt = self._get_upsert(ElementModel, values, ["id"])
            await session.execute(stmt)

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        if self.show_logger:
            logger.info(f"SQLAlchemy: delete_element, element_id={element_id}")

        async with self._session() as session:
            stmt = select(ElementModel).where(ElementModel.id == element_id)
            result = await session.execute(stmt)
            elem = result.scalar_one_or_none()

            if elem and self.storage_provider and elem.objectKey:
                await self.storage_provider.delete_file(object_key=elem.objectKey)

            await session.execute(
                delete(ElementModel).where(ElementModel.id == element_id)
            )

    async def get_all_user_threads(
        self, user_id: Optional[str] = None, thread_id: Optional[str] = None
    ) -> Optional[list[ThreadDict]]:
        if self.show_logger:
            logger.info("SQLAlchemy: get_all_user_threads")

        async with self._session() as session:
            subq = (
                select(
                    StepModel.threadId,
                    func.max(StepModel.createdAt).label("max_created"),
                )
                .group_by(StepModel.threadId)
                .subquery()
            )

            conditions = []
            if user_id is not None:
                conditions.append(ThreadModel.userId == user_id)
            if thread_id is not None:
                conditions.append(ThreadModel.id == thread_id)

            if not conditions:
                return []

            stmt = (
                select(ThreadModel, subq.c.max_created)
                .outerjoin(subq, ThreadModel.id == subq.c.threadId)
                .where(or_(*conditions))
                .order_by(subq.c.max_created.desc().nulls_last())
                .limit(self.user_thread_limit)
            )

            result = await session.execute(stmt)
            rows = result.fetchall()

            if not rows:
                return []

            thread_ids = [row[0].id for row in rows]

            steps_stmt = (
                select(StepModel)
                .options(selectinload(StepModel.feedbacks))
                .where(StepModel.threadId.in_(thread_ids))
                .order_by(StepModel.createdAt.asc())
            )
            steps_result = await session.execute(steps_stmt)
            all_steps = steps_result.scalars().all()

            elements_stmt = select(ElementModel).where(
                ElementModel.threadId.in_(thread_ids)
            )
            elements_result = await session.execute(elements_stmt)
            all_elements = elements_result.scalars().all()

            thread_dicts: dict[str, ThreadDict] = {}
            for row in rows:
                thread = row[0]
                thread_dicts[thread.id] = ThreadDict(
                    id=thread.id,
                    createdAt=thread.createdAt,
                    name=thread.name,
                    userId=thread.userId,
                    userIdentifier=thread.userIdentifier,
                    tags=json.loads(thread.tags) if thread.tags else None,
                    metadata=self._parse_json(thread.metadata_),
                    steps=[],
                    elements=[],
                )

            for step in all_steps:
                if step.threadId in thread_dicts:
                    feedback = None
                    if step.feedbacks:
                        fb = step.feedbacks[0]
                        feedback = FeedbackDict(
                            forId=step.id,
                            id=fb.id,
                            value=fb.value,
                            comment=fb.comment,
                        )
                    step_dict = StepDict(
                        id=step.id,
                        name=step.name,
                        type=step.type,
                        threadId=step.threadId,
                        parentId=step.parentId,
                        streaming=step.streaming or False,
                        waitForAnswer=step.waitForAnswer,
                        isError=step.isError,
                        metadata=self._parse_json(step.metadata_),
                        tags=json.loads(step.tags) if step.tags else None,
                        input=step.input
                        if step.showInput not in (None, "false")
                        else "",
                        output=step.output or "",
                        createdAt=step.createdAt,
                        start=step.start,
                        end=step.end,
                        generation=self._parse_json(step.generation),
                        showInput=step.showInput,
                        language=step.language,
                        feedback=feedback,
                    )
                    thread_dicts[step.threadId]["steps"].append(step_dict)

            for elem in all_elements:
                tid = elem.threadId
                if tid and tid in thread_dicts:
                    element_url: Optional[str] = None
                    if (
                        self.storage_provider
                        and elem.objectKey
                        and elem.objectKey.strip()
                    ):
                        try:
                            element_url = await self.storage_provider.get_read_url(
                                object_key=elem.objectKey
                            )
                        except Exception as e:
                            logger.warning(
                                f"Failed to get read URL for object_key '{elem.objectKey}': {e}"
                            )
                            element_url = elem.url
                    else:
                        element_url = elem.url

                    element_dict = ElementDict(
                        id=elem.id,
                        threadId=tid,
                        type=elem.type,
                        chainlitKey=elem.chainlitKey,
                        url=element_url,
                        objectKey=elem.objectKey,
                        name=elem.name,
                        display=elem.display,
                        size=elem.size,
                        language=elem.language,
                        autoPlay=elem.autoPlay,
                        playerConfig=elem.playerConfig,
                        page=elem.page,
                        props=self._parse_json(elem.props),
                        forId=elem.forId,
                        mime=elem.mime,
                    )
                    thread_dicts[tid]["elements"].append(element_dict)  # type: ignore

            return list(thread_dicts.values())

    async def get_favorite_steps(self, user_id: str) -> list[StepDict]:
        if self.show_logger:
            logger.info(f"SQLAlchemy: get_favorite_steps, user_id={user_id}")

        async with self._session() as session:
            stmt = (
                select(StepModel)
                .join(ThreadModel, StepModel.threadId == ThreadModel.id)
                .where(ThreadModel.userId == user_id)
                .order_by(StepModel.createdAt.desc())
            )
            result = await session.execute(stmt)
            all_steps = result.scalars().all()

            steps = []
            for step in all_steps:
                meta_dict = self._parse_json(step.metadata_)
                if meta_dict.get("favorite"):
                    steps.append(
                        StepDict(
                            id=step.id,
                            name=step.name,
                            type=step.type,
                            threadId=step.threadId,
                            parentId=step.parentId,
                            streaming=step.streaming or False,
                            waitForAnswer=step.waitForAnswer,
                            isError=step.isError,
                            metadata=meta_dict,
                            tags=json.loads(step.tags) if step.tags else None,
                            input=step.input
                            if step.showInput not in (None, "false")
                            else "",
                            output=step.output or "",
                            createdAt=step.createdAt,
                            start=step.start,
                            end=step.end,
                            generation=self._parse_json(step.generation),
                            showInput=step.showInput,
                            language=step.language,
                            feedback=None,
                        )
                    )
            return steps

    async def close(self) -> None:
        if self.storage_provider:
            await self.storage_provider.close()
        await self.engine.dispose()
