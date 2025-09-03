from sqlmodel import SQLModel, create_engine, select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine, async_sessionmaker
from contextlib import asynccontextmanager
from chainlit.data.base import BaseDataLayer
from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.data.utils import queue_until_user_message
from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import ValidationError
from chainlit.models import PersistedUser, User, Feedback, Thread, Element, Step
import json
import ssl
import uuid
from chainlit.logger import logger
from chainlit.types import (
    PaginatedResponse,
    Pagination,
    ThreadFilter,
    PageInfo
)
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool
from sqlalchemy import event

ALLOWED_ASYNC_DRIVERS = {
    "postgresql+asyncpg",
    "postgresql+psycopg",  # psycopg3 async
    "sqlite+aiosqlite",
    "mysql+aiomysql",
    "mysql+asyncmy",
    "mariadb+aiomysql",
    "mariadb+asyncmy",
    "mssql+aioodbc",
}

class SQLDataLayer(BaseDataLayer):
    def __init__(
        self,
        conninfo: str,
        connect_args: Optional[dict[str, Any]] = None,
        ssl_require: bool = False,
        storage_provider: Optional[BaseStorageClient] = None,
        user_thread_limit: Optional[int] = 1000,
        show_logger: Optional[bool] = False,
    ):
        self._conninfo = conninfo
        self.user_thread_limit = user_thread_limit
        self.show_logger = bool(show_logger)

        connect_args = dict(connect_args or {})

        # Validate async driver and prepare per-dialect settings
        url = make_url(self._conninfo)
        driver = url.drivername  # e.g., "postgresql+asyncpg"
        backend = url.get_backend_name()  # e.g., "postgresql"
        if driver not in ALLOWED_ASYNC_DRIVERS:
            raise ValueError(f"Connection URL must use an async driver. Got '{driver}'. Use one of: {ALLOWED_ASYNC_DRIVERS}")

        if ssl_require:
            # Create an SSL context to require an SSL connection
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = True
            ssl_context.verify_mode = ssl.CERT_REQUIRED
            connect_args.setdefault("ssl", ssl_context)
        self.engine: AsyncEngine = create_async_engine(
                self._conninfo,
                connect_args=connect_args,
                echo=self.show_logger,
            )
        self.async_session = async_sessionmaker(
            bind=self.engine, expire_on_commit=False, class_=AsyncSession
        )
        if storage_provider:
            self.storage_provider: Optional[BaseStorageClient] = storage_provider
            if self.show_logger:
                logger.info("SQLDataLayer storage client initialized")
        else:
            self.storage_provider = None
            logger.warning("SQLDataLayer storage client is not initialized and elements will not be persisted!")

    async def init_db(self):
        """
        Explicitly create tables for development or testing only.
        In production, use Alembic migrations!
        """
        logger.warning("init_db should only be used for local development or tests. Use Alembic for production migrations.")
        async with self.engine.begin() as conn:
            # await conn.run_sync(SQLModel.metadata.drop_all)  # Uncomment to drop tables
            await conn.run_sync(SQLModel.metadata.create_all)
    
    async def aclose(self) -> None:
        await self.engine.dispose()

    async def create_user(self, user: User) -> Optional[PersistedUser]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(PersistedUser).where(PersistedUser.identifier == user.identifier))
            existing = result.scalar_one_or_none()
            if existing:
                return existing
            db_user = PersistedUser(
                identifier=user.identifier,
                metadata=user.metadata,
            )
            session.add(db_user)
            return db_user
        
    async def get_user(self, identifier: str) -> Optional[PersistedUser]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(PersistedUser).where(PersistedUser.identifier == identifier))
            user = result.scalar_one_or_none()
            return user

    async def update_user(self, identifier: str, metadata: Optional[dict] = None) -> Optional[PersistedUser]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(PersistedUser).where(PersistedUser.identifier == identifier))
            user = result.scalar_one_or_none()
            if user:
                if metadata is not None:
                    user.metadata = metadata
                await session.refresh(user)
                return PersistedUser(identifier=user.identifier, metadata=user.metadata)
            return None

    async def delete_user(self, identifier: str) -> bool:
        async with self.async_session.begin() as session:
            result = await session.execute(select(PersistedUser).where(PersistedUser.identifier == identifier))
            user = result.scalar_one_or_none()
            if user:
                await session.delete(user)
                return True
            return False

    async def create_thread(self, thread_data: dict) -> Optional[Dict]:
        try:
            thread = Thread.model_validate(thread_data)
        except ValidationError as e:
            logger.error(f"Thread data validation error: {e}")
            return None
        async with self.async_session.begin() as session:
            session.add(thread)
            await session.refresh(thread)
            return thread.to_dict()
        
    async def get_thread(self, thread_id: str) -> Optional[Dict]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Thread).where(Thread.id == thread_id))
            thread = result.scalar_one_or_none()
            if thread:
                return thread.to_dict()
            return None
        
    async def get_thread_author(self, thread_id: str) -> str:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Thread).where(Thread.id == thread_id))
            thread: Thread = result.scalar_one_or_none()
            if thread and thread.user_identifier:
                return thread.user_identifier
            return ""

    async def update_thread(self, thread_id: str, **kwargs) -> Optional[Dict]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Thread).where(Thread.id == thread_id))
            thread = result.scalar_one_or_none()
            if thread:
                for k, v in kwargs.items():
                    setattr(thread, k, v)
                await session.refresh(thread)
                return thread.to_dict()
            return None

    async def delete_thread(self, thread_id: str) -> bool:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Thread).where(Thread.id == thread_id))
            thread = result.scalar_one_or_none()
            if thread:
                await session.delete(thread)
                return True
            return False
    
    @queue_until_user_message()
    async def create_step(self, step_data: dict) -> Optional[Dict]:
        try:
            step = Step.model_validate(step_data)
        except ValidationError as e:
            logger.error(f"Thread data validation error: {e}")
            return None
        async with self.async_session.begin() as session:
            session.add(step)
            await session.refresh(step)
            return step.to_dict()

    async def get_step(self, step_id: str) -> Optional[Dict]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Step).where(Step.id == step_id))
            step = result.scalar_one_or_none()
            if step:
                return step.to_dict()
            return None

    @queue_until_user_message()
    async def update_step(self, step_id: str, **kwargs) -> Optional[Dict]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Step).where(Step.id == step_id))
            step = result.scalar_one_or_none()
            if step:
                for k, v in kwargs.items():
                    setattr(step, k, v)
                await session.refresh(step)
                return step.to_dict()
            return None

    @queue_until_user_message()
    async def delete_step(self, step_id: str) -> bool:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Step).where(Step.id == step_id))
            step = result.scalar_one_or_none()
            if step:
                await session.delete(step)
                return True
            return False
        
    async def upsert_feedback(self, feedback: Feedback) -> str:
        feedback_id = feedback.id or str(uuid.uuid4())
        feedback_dict = feedback.dict()
        feedback_dict["id"] = feedback_id
        async with self.async_session.begin() as session:
            result = await session.execute(select(Feedback).where(Feedback.id == feedback_id))
            db_feedback = result.scalar_one_or_none()
            if db_feedback:
                for k, v in feedback_dict.items():
                    setattr(db_feedback, k, v)
            else:
                db_feedback = Feedback.model_validate(feedback_dict)
                session.add(db_feedback)
            await session.refresh(db_feedback)
            return db_feedback.id

    async def get_feedback(self, feedback_id: str) -> Optional[Dict]:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Feedback).where(Feedback.id == feedback_id))
            feedback = result.scalar_one_or_none()
            if feedback:
                return feedback.to_dict()
            return None

    async def delete_feedback(self, feedback_id: str) -> bool:
        async with self.async_session.begin() as session:
            result = await session.execute(select(Feedback).where(Feedback.id == feedback_id))
            feedback = result.scalar_one_or_none()
            if feedback:
                await session.delete(feedback)
                return True
            return False
        
    async def get_element(self, thread_id: str, element_id: str) -> Optional[Dict]:
        async with self.async_session.begin() as session:
            result = await session.execute(
                select(Element).where(Element.thread_id == thread_id, Element.id == element_id)
            )
            element = result.scalar_one_or_none()
            if element:
                # props should be deserialized if stored as JSON string
                props = element.props
                if isinstance(props, str):
                    props = json.loads(props)
                return {
                    **element.to_dict(),
                    "props": props,
                }
            return None

    @queue_until_user_message()
    async def create_element(self, element: "Element"):
        if self.show_logger:
            logger.info(f"SQLDataLayer: create_element, element_id = {element.id}")

        if not self.storage_provider:
            logger.warning("SQLDataLayer: create_element error. No blob_storage_client is configured!")
            return
        if not element.for_id:
            return

        content: Optional[bytes] = None
        if element.path:
            import aiofiles
            async with aiofiles.open(element.path, "rb") as f:
                content = await f.read()
        elif element.url:
            import aiohttp
            async with aiohttp.ClientSession() as session_http:
                async with session_http.get(element.url) as response:
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

        user_id: str = await self._get_user_id_by_thread(element.thread_id) or "unknown"
        file_object_key = f"{user_id}/{element.id}" + (f"/{element.name}" if element.name else "")

        if not element.mime:
            element.mime = "application/octet-stream"

        uploaded_file = await self.storage_provider.upload_file(
            object_key=file_object_key, data=content, mime=element.mime, overwrite=True
        )
        if not uploaded_file:
            raise ValueError("SQLModel Error: create_element, Failed to persist data in storage_provider")

        element_dict = element.to_dict()
        element_dict["url"] = uploaded_file.get("url")
        element_dict["objectKey"] = uploaded_file.get("object_key")
        element_dict_cleaned = {k: v for k, v in element_dict.items() if v is not None}
        if "props" in element_dict_cleaned:
            element_dict_cleaned["props"] = json.dumps(element_dict_cleaned["props"])

        async with self.async_session.begin() as session:
            db_element = Element.model_validate(element_dict_cleaned)
            session.add(db_element)
            await session.refresh(db_element)
            return db_element.to_dict()

    @queue_until_user_message()
    async def delete_element(self, element_id: str, thread_id: Optional[str] = None):
        if self.show_logger:
            logger.info(f"SQLDataLayer: delete_element, element_id={element_id}")

        async with self.async_session.begin() as session:
            query = select(Element).where(Element.id == element_id)
            if thread_id:
                query = query.where(Element.thread_id == thread_id)
            result = await session.execute(query)
            element = result.scalar_one_or_none()
            element_dict = element.to_dict() if element else None
            if (
                self.storage_provider is not None
                and element is not None
                and getattr(element_dict, "objectKey", None)
            ):
                await self.storage_provider.delete_file(object_key=element['objectKey'])
            if element:
                await session.delete(element)

    async def build_debug_url(self) -> str:
        # Implement as needed, or return empty string for now
        return ""

    async def list_threads(
        self, pagination: Pagination, filters: ThreadFilter
    ) -> PaginatedResponse[Dict]:
        # Fetch threads for a user, apply pagination and filters
        async with self.async_session.begin() as session:
            if filters.userId:
                query = select(Thread).where(Thread.user_id == filters.userId)
            result = await session.execute(query)
            threads = result.scalars().all()
            # Apply search filter
            if filters.search:
                threads = [t for t in threads if filters.search.lower() in (t.name or '').lower()]
            # Apply feedback filter (if present)
            if filters.feedback is not None:
                # This requires joining with Feedback, so for now, skip or implement as needed
                pass
            # Pagination
            start = 0
            if pagination.cursor:
                for i, t in enumerate(threads):
                    if t.id == pagination.cursor:
                        start = i + 1
                        break
            end = start + pagination.first
            paginated_threads = threads[start:end]
            has_next_page = len(threads) > end
            start_cursor = paginated_threads[0].id if paginated_threads else None
            end_cursor = paginated_threads[-1].id if paginated_threads else None
            # Convert to dicts
            data = [t.to_dict() for t in paginated_threads]
            # Build PaginatedResponse
            return PaginatedResponse(
                pageInfo=PageInfo(
                    hasNextPage=has_next_page,
                    startCursor=start_cursor,
                    endCursor=end_cursor,
                ),
                data=data,
            )