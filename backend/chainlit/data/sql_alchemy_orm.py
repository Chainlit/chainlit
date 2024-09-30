import datetime
import json
import logging
import os
import ssl
import uuid
from typing import Any, Callable, Dict, List, Optional, Union, cast

import aiofiles
import aiohttp
import sqlalchemy
from chainlit.data import queue_until_user_message
from chainlit.data.base import BaseDataLayer, BaseStorageClient
from chainlit.element import Element, ElementDict
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
from pydantic.dataclasses import Field, dataclass
from sqlalchemy import (
    ARRAY,
    JSON,
    UUID,
    Boolean,
    Column,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    SelectBase,
    String,
    Table,
    TextClause,
    UpdateBase,
    asc,
    desc,
    insert,
    or_,
    select,
    update,
)
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql.type_api import TypeEngine

logger = logging.getLogger("sqlalchemydatalayer")


@dataclass
class SQLDialectSettings:
    type_replacements: Dict[str, str] = Field(
        description="A dictionary of SQLAlchemy types (as string) "
        "to replace some special types such as ARRAY or JSON",
        default_factory=dict,
    )


# Use SQL_ALCHEMY_DIALECT_SETTINGS from environment variable if set
# else use the default here
SQL_ALCHEMY_DIALECT_SETTINGS: Dict[str, Dict] = (
    json.loads(os.environ["SQL_ALCHEMY_DIALECT_SETTINGS"])
    if "SQL_ALCHEMY_DIALECT_SETTINGS" in os.environ
    else {
        "mysql": {
            "type_replacements": {"ARRAY": "JSON"},
        },
        "postgresql": {
            "type_replacements": {"JSON": "JSONB"},
        },
        "sqlite": {
            "type_replacements": {"ARRAY": "JSON"},
        },
    }
)


# Helper function to convert string such as "ARRAY", "JSON" to SQLAlchemy type
def get_sqlalchemy_type(
    dialect_name: str,
    type_replacements: Dict[str, str],
    type_name: str,
    default: TypeEngine[Any],
) -> TypeEngine:
    type_class_name = type_replacements.get(type_name)

    if not type_class_name:
        return default

    if hasattr(sqlalchemy, type_class_name):
        return getattr(sqlalchemy, type_class_name)

    if hasattr(sqlalchemy.dialects, dialect_name):
        dialect_class = getattr(sqlalchemy.dialects, dialect_name)
        if hasattr(dialect_class, type_class_name):
            return getattr(dialect_class, type_class_name)

    return default


class SQLAlchemyORMDataLayer(BaseDataLayer):
    """
    A Chainlit Data Layer that integrates with SQLAlchemy to manage database operations.
    This uses SQLAlchemy's ORM (Object-Relational Mapping) to interact with the database instead of writing raw SQL queries.

    By using ORM, it can potentially support multiple dialects including PostgreSQL, MySQL, SQLite, Oracle, and MSSQL, as well as many others listed here: https://docs.sqlalchemy.org/en/20/dialects/#support-levels-for-included-dialects
    """  # noqa: E501

    dialect_name: str
    metadata: MetaData
    users: Table
    threads: Table
    steps: Table
    elements: Table
    feedbacks: Table

    def __init__(
        self,
        url: str,
        connect_args: Optional[Dict] = None,
        ssl_require: bool = False,
        storage_provider: Optional[BaseStorageClient] = None,
        log_level: str = "INFO",
    ):
        """
        Create a new Chainlit Data Layer using SQLAlchemy.

        Supported dialects: https://docs.sqlalchemy.org/en/20/dialects/#support-levels-for-included-dialects

        :param url: Database connection string.
        :param ssl_require: Whether SSL is required for the connection.
        :param storage_provider: Optional storage client for file-based elements.
        :param log_level: Log level for this class. Use DEBUG to see SQLs generated by the engine.
        """  # noqa: E501
        logger.setLevel(log_level)
        logger.info("SQLAlchemyORM: __init__")

        connect_args = connect_args or {}
        if ssl_require:
            # Create an SSL context to require an SSL connection
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_args["ssl"] = ssl_context
        self.engine: AsyncEngine = create_async_engine(
            url,
            connect_args=connect_args,
            echo=log_level == "DEBUG",  # Enable SQL logging
        )
        self.async_session = sessionmaker(  # type: ignore
            bind=self.engine, expire_on_commit=False, class_=AsyncSession
        )
        if storage_provider:
            self.storage_provider: Optional[BaseStorageClient] = storage_provider
            logger.info("SQLAlchemyDataLayer storage client initialized")
        else:
            self.storage_provider = None
            logger.warning(
                "SQLAlchemyDataLayer storage client is not initialized and "
                "some elements will not be persisted!"
            )

        self.init_objects()

    def init_objects(self):
        logger.info(f"SQLAlchemyORM: Initializing objects")

        self.dialect_name = self.engine.dialect.name

        # Note: Default settings is applied for dialect not in the dictionary
        dialect_settings: SQLDialectSettings = self.get_dialect_settings(
            self.dialect_name
        )

        self.metadata = MetaData()

        self.users = Table(
            "users",
            self.metadata,
            Column("id", UUID(as_uuid=False), primary_key=True),
            Column("identifier", String, unique=True, nullable=False),
            Column(
                "metadata",
                get_sqlalchemy_type(
                    self.dialect_name,
                    dialect_settings.type_replacements,
                    "JSON",
                    default=JSON,  # type: ignore
                ),
                nullable=False,
            ),
            Column("createdAt", String),
            Index("ix_users_identifier", "identifier", unique=True),
        )

        self.threads = Table(
            "threads",
            self.metadata,
            Column("id", UUID(as_uuid=False), primary_key=True),
            Column("createdAt", String),
            Column("updatedAt", String),
            Column("name", String),
            Column(
                "userId",
                UUID(as_uuid=False),
                ForeignKey("users.id", ondelete="CASCADE"),
            ),
            Column("userIdentifier", String),
            Column(
                "tags",
                get_sqlalchemy_type(
                    self.dialect_name,
                    dialect_settings.type_replacements,
                    "ARRAY",
                    default=ARRAY(String),
                ),
            ),
            Column(
                "metadata",
                get_sqlalchemy_type(
                    self.dialect_name,
                    dialect_settings.type_replacements,
                    "JSON",
                    default=JSON,  # type: ignore
                ),
            ),
            Index("ix_threads_userId", "userId"),
        )

        self.steps = Table(
            "steps",
            self.metadata,
            Column("id", UUID(as_uuid=False), primary_key=True),
            Column("name", String, nullable=False),
            Column("type", String, nullable=False),
            Column("threadId", UUID(as_uuid=False), nullable=False),
            Column("parentId", UUID(as_uuid=False)),
            Column("streaming", Boolean, nullable=False),
            Column("waitForAnswer", Boolean),
            Column("isError", Boolean),
            Column(
                "metadata",
                get_sqlalchemy_type(
                    self.dialect_name,
                    dialect_settings.type_replacements,
                    "JSON",
                    default=JSON,  # type: ignore
                ),
            ),
            Column(
                "tags",
                get_sqlalchemy_type(
                    self.dialect_name,
                    dialect_settings.type_replacements,
                    "ARRAY",
                    default=ARRAY(String),
                ),
            ),
            Column("input", String),
            Column("output", String),
            Column("createdAt", String),
            Column("start", String),
            Column("end", String),
            Column(
                "generation",
                get_sqlalchemy_type(
                    self.dialect_name,
                    dialect_settings.type_replacements,
                    "JSON",
                    default=JSON,  # type: ignore
                ),
            ),
            Column("showInput", String),
            Column("language", String),
            Column("indent", Integer),
            Index("ix_steps_threadId", "threadId"),
        )

        self.elements = Table(
            "elements",
            self.metadata,
            Column("id", UUID(as_uuid=False), primary_key=True),
            Column("forId", UUID(as_uuid=False), nullable=False),
            Column("threadId", UUID(as_uuid=False), nullable=False),
            Column("type", String),
            Column("url", String),
            Column("chainlitKey", String),
            Column("name", String, nullable=False),
            Column("display", String),
            Column("objectKey", String),
            Column("size", String),
            Column("page", Integer),
            Column("autoPlay", Boolean),
            Column(
                "playerConfig",
                get_sqlalchemy_type(
                    self.dialect_name,
                    dialect_settings.type_replacements,
                    "JSON",
                    default=JSON,  # type: ignore
                ),
            ),
            Column("language", String),
            Column("mime", String),
            Column("createdAt", String),
            Index("ix_elements_threadId", "threadId"),
        )

        self.feedbacks = Table(
            "feedbacks",
            self.metadata,
            Column("id", UUID(as_uuid=False), primary_key=True),
            Column("forId", UUID(as_uuid=False), nullable=False),
            Column("threadId", UUID(as_uuid=False), nullable=False),
            Column("value", Integer, nullable=False),
            Column("comment", String),
            Index("ix_feedbacks_forId", "forId"),
            Index("ix_feedbacks_threadId", "threadId"),
        )

    @classmethod
    def get_dialect_settings(
        cls,
        dialect: str,
    ) -> SQLDialectSettings:
        return SQLDialectSettings(  # type: ignore
            **SQL_ALCHEMY_DIALECT_SETTINGS.get(dialect, {})
        )

    async def create_objects(self, metadata_override: Optional[MetaData] = None):
        """Create all tables and indices if not exists"""
        logger.info(f"SQLAlchemyORM: create_objects")
        try:
            async with self.engine.begin() as conn:
                # create all tables
                metadata = metadata_override or self.metadata
                await conn.run_sync(metadata.create_all)
                await conn.commit()
        except Exception as e:
            if conn:
                await conn.rollback()
            logger.error("SQLAlchemyORM: create_objects, " f"error: {e}")
            raise e

    async def build_debug_url(self) -> str:
        return ""

    # --- SQL Helpers --- #
    async def execute_stmt(
        self, stmt: Union[SelectBase, UpdateBase, TextClause]
    ) -> Union[List[Dict[str, Any]], int, None]:
        results = await self.execute_stmts([stmt])

        return results[0] if results else None

    async def execute_stmts(
        self, stmts: List[Union[SelectBase, UpdateBase, TextClause]]
    ) -> Union[List[Union[List[Dict[str, Any]], int]], None]:
        async with self.async_session() as session:
            try:
                await session.begin()
                results = [await session.execute(_) for _ in stmts]
                await session.commit()
                return [
                    (
                        [dict(row._mapping) for row in result.fetchall()]
                        if result.returns_rows
                        else result.rowcount
                    )
                    for result in results
                ]
            except Exception as e:
                await session.rollback()
                logger.warning(f"SQLAlchemyORM: execute_stmts error: {e}")
                return None

    async def get_current_timestamp(self) -> str:
        return datetime.datetime.now(datetime.timezone.utc).isoformat()

    async def upsert_record(
        self,
        table: Table,
        record_id: str,
        data: Union[ThreadDict, StepDict, FeedbackDict, Dict],
        exclude_none: bool = True,
        exclude_empty_dict: bool = True,
    ):
        if exclude_none:
            # Remove keys with None value
            data = {key: value for key, value in data.items() if value is not None}
        if exclude_empty_dict:
            # Remove keys with empty dictionary
            data = {
                key: value
                for key, value in data.items()
                if not (isinstance(value, dict) and not value)
            }

        insert: Callable

        update_data = {k: v for k, v in data.items() if k != "id"}
        if self.dialect_name in ["postgresql", "sqlite"]:
            # Insert with ON CONFLICT DO UPDATE
            if self.dialect_name == "postgresql":
                from sqlalchemy.dialects.postgresql import insert
            else:
                from sqlalchemy.dialects.sqlite import insert

            stmt = (
                insert(table)
                .values(**data)
                .on_conflict_do_update(
                    index_elements=["id"],
                    set_=update_data,
                )
            )

            await self.execute_stmt(stmt)

        else:
            from sqlalchemy import insert

            # Attempt to update and check if it affects any record
            update_stmt = (
                update(table).where(table.c.id == record_id).values(**update_data)
            )

            affected_row_count = await self.execute_stmt(update_stmt)
            if affected_row_count == 0:
                # if no record is updated, then insert
                stmt = insert(self.threads).values(**data)

                await self.execute_stmt(stmt)

    # --- User --- #
    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        logger.info(f"SQLAlchemyORM: get_user, identifier={identifier}")

        stmt = select(self.users).where(self.users.c.identifier == identifier)

        result = await self.execute_stmt(stmt)

        if result and isinstance(result, list):
            user_data = result[0]
            return PersistedUser(**user_data)

        return None

    async def _get_user_identifer_by_id(self, user_id: str) -> str:
        logger.info(f"SQLAlchemyORM: _get_user_identifer_by_id, user_id={user_id}")
        stmt = select(self.users.c.identifier).where(self.users.c.id == user_id)

        result = await self.execute_stmt(stmt)

        assert result
        assert isinstance(result, list)

        return result[0]["identifier"]

    async def _get_user_id_by_thread(self, thread_id: str) -> Optional[str]:
        logger.info(f"SQLAlchemyORM: _get_user_id_by_thread, thread_id={thread_id}")
        stmt = select(self.threads.c.userId).where(self.threads.c.id == thread_id)

        result = await self.execute_stmt(stmt)

        if result:
            assert isinstance(result, list)
            return result[0]["userId"]

        return None

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        logger.info(f"SQLAlchemyORM: create_user, user_identifier={user.identifier}")

        existing_user: Optional["PersistedUser"] = await self.get_user(user.identifier)

        user_dict: Dict[str, Any] = {
            "identifier": str(user.identifier),
            "metadata": user.metadata or {},
        }

        if not existing_user:  # create the user
            logger.info("SQLAlchemyORM: create_user, creating the user")
            user_dict["id"] = str(uuid.uuid4())
            user_dict["createdAt"] = await self.get_current_timestamp()

            insert_stmt = insert(self.users).values(**user_dict)

            await self.execute_stmt(insert_stmt)

            return await self.get_user(user.identifier)
        else:  # update the user
            logger.info("SQLAlchemyORM: update user metadata")

            existing_user.metadata.update(user_dict["metadata"])

            update_stmt = (
                update(self.users)
                .where(self.users.c.identifier == user.identifier)
                .values(metadata=user_dict["metadata"])
            )

            await self.execute_stmt(update_stmt)

            return existing_user

    # --- Threads --- #
    async def get_thread_author(self, thread_id: str) -> str:
        logger.info(f"SQLAlchemyORM: get_thread_author, thread_id={thread_id}")

        stmt = select(self.threads.c.userIdentifier).where(
            self.threads.c.id == thread_id
        )
        result = await self.execute_stmt(stmt)

        if isinstance(result, list) and result:
            author_identifier = result[0].get("userIdentifier")
            if author_identifier is not None:
                return author_identifier

        raise ValueError(f"Author not found for thread_id {thread_id}")

    async def get_thread(self, thread_id: str) -> Optional[ThreadDict]:
        logger.info(f"SQLAlchemyORM: get_thread, thread_id={thread_id}")

        # Aliases for tables
        threads: Table = self.threads
        steps: Table = self.steps
        feedbacks: Table = self.feedbacks
        elements: Table = self.elements

        # Select thread and associated steps and feedbacks
        # Get all available columns and treat conflicting names later
        thread_steps_stmt = (
            select(threads, steps, feedbacks)
            .select_from(
                threads.outerjoin(steps, steps.c.threadId == threads.c.id).outerjoin(
                    feedbacks, steps.c.id == feedbacks.c.forId
                )
            )
            .where(threads.c.id == thread_id)
            .order_by(asc(steps.c.createdAt))
        )

        thread_steps = await self.execute_stmt(thread_steps_stmt)

        if not isinstance(thread_steps, list) or not thread_steps:
            return None

        steps_dicts = [
            cast(
                StepDict,
                {
                    **{
                        **{
                            column.name: step.get(column.name)
                            for column in steps.c
                            if column.name in step
                        },
                        "id": step["id_1"],
                        "name": step["name_1"],
                        "metadata": step["metadata_1"],
                        "tags": step["tags_1"],
                        "createdAt": step["createdAt_1"],
                        "feedback": cast(
                            FeedbackDict,
                            {
                                **{
                                    **{
                                        column.name: step.get(column.name)
                                        for column in feedbacks.c
                                        if column.name in step
                                    },
                                    "id": step["id_2"],
                                    "threadId": step["threadId_1"],
                                }
                            },
                        ),
                    }
                },
            )
            for step in thread_steps
            if step["threadId"]
        ]

        # Select associated elements
        elements_stmt = (
            select(elements)
            .where(elements.c.threadId == thread_id)
            .order_by(elements.c.createdAt)
        )

        elements_result = await self.execute_stmt(elements_stmt)
        elements_dicts = (
            [
                cast(
                    ElementDict,
                    {
                        **{
                            column.name: element.get(column.name)
                            for column in elements.c
                            if column.name in element
                        }
                    },
                )
                for element in elements_result
            ]
            if isinstance(elements_result, list)
            else None
        )

        return cast(
            ThreadDict,
            {
                **{
                    column.name: thread_steps[0].get(column.name)
                    for column in threads.c
                    if column.name in thread_steps[0]
                },
                "steps": steps_dicts,
                "elements": elements_dicts,
            },
        )

    async def update_thread(
        self,
        thread_id: str,
        name: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ):
        logger.info(f"SQLAlchemyORM: update_thread, thread_id={thread_id}")

        user_identifier = None
        if user_id:
            user_identifier = await self._get_user_identifer_by_id(user_id)

        data = cast(
            ThreadDict,
            {
                "id": thread_id,
                "createdAt": (
                    await self.get_current_timestamp() if metadata is None else None
                ),
                "updatedAt": await self.get_current_timestamp(),
                "name": (
                    metadata.get("thread_name")  # Allow setting name via metadata
                    if metadata is not None
                    else name
                ),
                "userId": user_id,
                "userIdentifier": user_identifier,
                "tags": tags,
                "metadata": (
                    {k: v for k, v in metadata.items() if v is not None}
                    if metadata  # Remove keys with None values
                    else None
                ),
            },
        )

        await self.upsert_record(self.threads, thread_id, data)

    async def delete_thread(self, thread_id: str):
        logger.info(f"SQLAlchemyORM: delete_thread, thread_id={thread_id}")
        # Delete feedbacks/elements/steps/thread
        feedbacks_stmt = self.feedbacks.delete().where(
            self.feedbacks.c.threadId == thread_id
        )
        elements_stmt = self.elements.delete().where(
            self.elements.c.threadId == thread_id
        )
        steps_stmt = self.steps.delete().where(self.steps.c.threadId == thread_id)
        thread_stmt = self.threads.delete().where(self.threads.c.id == thread_id)

        await self.execute_stmts(
            [feedbacks_stmt, elements_stmt, steps_stmt, thread_stmt]
        )

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse:
        logger.info(
            "SQLAlchemyORM: "
            f"list_threads, pagination={pagination}, filters={filters}"
        )
        if not filters.userId:
            raise ValueError("userId is required")

        threads = self.threads
        steps = self.steps
        feedbacks = self.feedbacks

        stmt = (
            select(threads)
            .distinct()
            .where(threads.c.userId == filters.userId)
            .order_by(desc(threads.c.updatedAt))
            # Get 1 more than requested to determine if there's a next page
            .limit(pagination.first + 1)
        )

        if filters.search:
            # Join steps to filter on step's input and output
            stmt = stmt.outerjoin(steps, threads.c.id == steps.c.threadId).where(
                or_(
                    threads.c.name.ilike(f"%{filters.search}%"),
                    steps.c.input.ilike(f"%{filters.search}%"),
                    steps.c.output.ilike(f"%{filters.search}%"),
                )
            )

        if filters.feedback is not None:
            stmt = stmt.join(feedbacks, threads.c.id == feedbacks.c.threadId).where(
                feedbacks.c.value == int(filters.feedback)
            )

        if pagination.cursor:
            stmt = stmt.where(threads.c.createdAt < pagination.cursor)

        logger.info(f"SQLAlchemyORM: filtering threads: {stmt.compile()}")

        filtered_threads = await self.execute_stmt(stmt)

        if not isinstance(filtered_threads, list):
            return PaginatedResponse(
                data=[],
                pageInfo=PageInfo(hasNextPage=False, startCursor=None, endCursor=None),
            )

        has_next_page = len(filtered_threads) > pagination.first
        start_cursor = filtered_threads[0]["createdAt"] if filtered_threads else None
        end_cursor = (
            filtered_threads[-2 if has_next_page else -1]["createdAt"]
            if filtered_threads
            else None
        )

        return PaginatedResponse(
            data=[
                ThreadDict(
                    id=thread["id"],
                    createdAt=thread["createdAt"],
                    name=thread["name"],
                    userId=thread["userId"],
                    userIdentifier=thread["userIdentifier"],
                    tags=thread["tags"],
                    metadata=thread["metadata"],
                    steps=[],
                    elements=[],
                )
                for thread in filtered_threads[: -1 if has_next_page else None]
            ],
            pageInfo=PageInfo(
                hasNextPage=has_next_page,
                startCursor=start_cursor,
                endCursor=end_cursor,
            ),
        )

    # --- Steps --- #
    @queue_until_user_message()
    async def create_step(self, step_dict: "StepDict"):
        step_id = step_dict["id"]
        logger.info(f"SQLAlchemyORM: create_step, step_id={step_id}")

        await self.upsert_record(self.steps, step_id, step_dict)

    @queue_until_user_message()
    async def update_step(self, step_dict: "StepDict"):
        step_id = step_dict["id"]
        logger.info(f"SQLAlchemyORM: update_step, step_id={step_id}")

        await self.upsert_record(self.steps, step_id, step_dict)

    @queue_until_user_message()
    async def delete_step(self, step_id: str):
        logger.info(f"SQLAlchemyORM: delete_step, step_id={step_id}")

        feedbacks_stmt = self.feedbacks.delete().where(
            self.feedbacks.c.forId == step_id
        )
        elements_stmt = self.elements.delete().where(self.elements.c.forId == step_id)
        steps_stmt = self.steps.delete().where(self.steps.c.id == step_id)

        await self.execute_stmts([feedbacks_stmt, elements_stmt, steps_stmt])

    # --- Feedback --- #
    async def upsert_feedback(self, feedback: Feedback) -> str:
        logger.info(f"SQLAlchemyORM: upsert_feedback, feedback_id={feedback.id}")
        feedback.id = feedback.id or str(uuid.uuid4())
        feedback_dict = feedback.__dict__

        await self.upsert_record(self.feedbacks, feedback.id, feedback_dict)

        return feedback.id

    async def delete_feedback(self, feedback_id: str) -> bool:
        logger.info(f"SQLAlchemyORM: delete_feedback, feedback_id={feedback_id}")
        stmt = self.feedbacks.delete().where(self.feedbacks.c.id == feedback_id)
        result = await self.execute_stmt(stmt)
        return result is not None

    # --- Elements --- #
    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional["ElementDict"]:
        logger.info(
            f"SQLAlchemyORM: get_element, thread_id={thread_id}, "
            f"element_id={element_id}"
        )

        stmt = select(self.elements).where(
            self.elements.c.threadId == thread_id,
            self.elements.c.id == element_id,
        )

        result = await self.execute_stmt(stmt)

        if isinstance(result, list):
            return cast(ElementDict, result[0])
        else:
            return None

    @queue_until_user_message()
    async def create_element(self, element: Element):
        logger.info(f"SQLAlchemyORM: create_element, element_id = {element.id}")
        if not self.storage_provider and not element.url:
            logger.warning(
                "SQLAlchemyORM: create_element error. "
                "No blob_storage_client is configured!"
            )
            return
        if not element.for_id:
            return

        url = element.url
        object_key = element.url

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

        if content and self.storage_provider:
            user_id: str = (
                await self._get_user_id_by_thread(element.thread_id) or "unknown"
            )
            file_object_key = f"{user_id}/{element.id}" + (
                f"/{element.name}" if element.name else ""
            )

            if not element.mime:
                element.mime = "application/octet-stream"

            uploaded_file = await self.storage_provider.upload_file(
                object_key=file_object_key,
                data=content,
                mime=element.mime,
                overwrite=True,
            )
            if not uploaded_file:
                raise ValueError(
                    "SQLAlchemyORM Error: create_element, "
                    "Failed to persist data in storage_provider"
                )
            url = uploaded_file.get("url")
            object_key = uploaded_file.get("object_key")

        element_dict: ElementDict = element.to_dict()

        element_dict["url"] = url
        element_dict["objectKey"] = object_key
        element_dict_cleaned = {
            k: json.dumps(v) if isinstance(v, dict) else v
            for k, v in element_dict.items()
            if v is not None
        }
        # Add custom field
        element_dict_cleaned["createdAt"] = await self.get_current_timestamp()

        stmt = insert(self.elements).values(element_dict_cleaned)
        await self.execute_stmt(stmt)

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        logger.info(f"SQLAlchemyORM: delete_element, element_id={element_id}")
        stmt = self.elements.delete().where(self.elements.c.id == element_id)
        await self.execute_stmt(stmt)
