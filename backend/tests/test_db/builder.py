import dataclasses as dc
import json
from typing import Any, Dict, List, Optional, Union

from chainlit.context import ChainlitContext
from chainlit.data.sql_alchemy import SQLAlchemyDataLayer
from chainlit.element import ElementDict
from chainlit.step import StepDict
from sqlalchemy import (
    JSON,
    UUID,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
)
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

import chainlit as cl
from chainlit import logger


async def build_db(conninfo="sqlite+aiosqlite:///database.db"):
    engine = create_async_engine(conninfo)

    metadata_obj = MetaData()

    # Create 'users' table
    Table(
        "users",
        metadata_obj,
        Column("id", UUID(as_uuid=True), primary_key=True),
        Column("identifier", String, nullable=False, unique=True),
        Column("metadata", JSON, nullable=False),
        Column(
            "createdAt",
            String,
        ),
        keep_existing=True,
    )

    # Create 'threads' table
    Table(
        "threads",
        metadata_obj,
        Column("id", UUID(as_uuid=True), primary_key=True),
        Column("createdAt", String),
        Column("name", String),
        Column(
            "userId", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
        ),
        Column("userIdentifier", String),
        Column(
            "tags", String
        ),  # Changed from ARRAY(String) as SQLite doesn't support array types
        Column("metadata", JSON),
        keep_existing=True,
    )

    Table(
        "steps",
        metadata_obj,
        Column("id", UUID(as_uuid=True), primary_key=True),
        Column("name", String, nullable=False),
        Column("type", String, nullable=False),
        Column("threadId", UUID(as_uuid=True), nullable=False),
        Column("parentId", UUID(as_uuid=True)),
        Column("disableFeedback", Boolean, nullable=False),
        Column("streaming", Boolean, nullable=False),
        Column("waitForAnswer", Boolean),
        Column("isError", Boolean),
        Column("metadata", JSON),
        Column(
            "tags", String
        ),  # Changed from ARRAY(String) as SQLite doesn't support array types
        Column("input", String),
        Column("output", String),
        Column("createdAt", String),
        Column("start", DateTime),
        Column("end", DateTime),
        Column("generation", JSON),
        Column("showInput", String),
        Column("language", String),
        Column("indent", Integer),
        keep_existing=True,
    )
    Table(
        "elements",
        metadata_obj,
        Column("id", UUID(as_uuid=True), primary_key=True),
        Column("threadId", UUID(as_uuid=True)),
        Column("type", String),
        Column("url", String),
        Column("chainlitKey", String),
        Column("name", String, nullable=False),
        Column("display", String),
        Column("objectKey", String),
        Column("size", String),
        Column("page", Integer),
        Column("language", String),
        Column("forId", UUID(as_uuid=True)),
        Column("mime", String),
        keep_existing=True,
    )
    Table(
        "feedbacks",
        metadata_obj,
        Column("id", UUID(as_uuid=True), primary_key=True),
        Column("forId", UUID(as_uuid=True), nullable=False),
        Column("threadId", UUID(as_uuid=True), nullable=False),
        Column("value", Integer, nullable=False),
        Column("comment", String),
        keep_existing=True,
    )

    async with engine.begin() as conn:
        await conn.run_sync(metadata_obj.create_all)


@dc.dataclass
class DummyChainlitContext(ChainlitContext):
    user: cl.User

    def __post_init__(self):
        pass

    @property
    def session(self):
        return self


class CustomDataLayer(SQLAlchemyDataLayer):
    def __init__(
        self,
        conninfo: str,
        context: ChainlitContext,
        # ssl_require: bool = False,
        # storage_provider: Optional[BaseStorageClient] = None,
        user_thread_limit: Optional[int] = 1000,
        show_logger: Optional[bool] = False,
    ):
        self._conninfo = conninfo
        self.user_thread_limit = user_thread_limit
        self.show_logger = show_logger
        self._context = context
        ssl_args = {}  # type: ignore

        self.engine: AsyncEngine = create_async_engine(
            self._conninfo, connect_args=ssl_args
        )
        self.async_session = sessionmaker(bind=self.engine, expire_on_commit=False, class_=AsyncSession)  # type: ignore

    @property
    def context(self):
        return self._context

    @context.setter
    def context(self, context: ChainlitContext):
        self._context = context

    async def execute_sql(
        self, query: str, parameters: dict
    ) -> Union[List[Dict[str, Any]], int, None]:
        require_metadata = "metadata" in query or "*" in query

        res = await super().execute_sql(query=query, parameters=parameters)
        if not require_metadata or not isinstance(res, list):
            return res

        for r in res:
            for key in r.keys():
                if "metadata" in key:
                    r[key] = json.loads(r[key]) if r[key] is not None else None

        return res

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

    async def create_step(self, step_dict: "StepDict"):
        if "disableFeedback" not in step_dict.keys():
            step_dict["disableFeedback"] = False  # type: ignore
        return await super().create_step(step_dict)

    async def get_element(
        self, thread_id: str, element_id: str
    ) -> Optional["ElementDict"]:
        pass
