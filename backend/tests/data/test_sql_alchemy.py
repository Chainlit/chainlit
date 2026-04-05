import json
import uuid
from pathlib import Path

import pytest
from chainlit import User
from chainlit.data.sql_alchemy import SQLAlchemyDataLayer
from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.element import Text
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


@pytest.fixture
async def data_layer(mock_storage_client: BaseStorageClient, tmp_path: Path):
    db_file = tmp_path / "test_db.sqlite"
    conninfo = f"sqlite+aiosqlite:///{db_file}"

    # Create async engine
    engine = create_async_engine(conninfo)

    # Execute initialization statements
    # Ref: https://docs.chainlit.io/data-persistence/custom#sql-alchemy-data-layer
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE users (
                    "id" UUID PRIMARY KEY,
                    "identifier" TEXT NOT NULL UNIQUE,
                    "metadata" JSONB NOT NULL,
                    "createdAt" TEXT
                );
        """
            )
        )

        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS threads (
                    "id" UUID PRIMARY KEY,
                    "createdAt" TEXT,
                    "name" TEXT,
                    "userId" UUID,
                    "userIdentifier" TEXT,
                    "tags" TEXT[],
                    "metadata" JSONB NOT NULL DEFAULT '{}',
                    FOREIGN KEY ("userId") REFERENCES users("id") ON DELETE CASCADE
                );
        """
            )
        )

        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS steps (
                    "id" UUID PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "type" TEXT NOT NULL,
                    "threadId" UUID NOT NULL,
                    "parentId" UUID,
                    "disableFeedback" BOOLEAN NOT NULL,
                    "streaming" BOOLEAN NOT NULL,
                    "waitForAnswer" BOOLEAN,
                    "isError" BOOLEAN,
                    "metadata" JSONB,
                    "tags" TEXT[],
                    "input" TEXT,
                    "output" TEXT,
                    "createdAt" TEXT,
                    "start" TEXT,
                    "end" TEXT,
                    "generation" JSONB,
                    "showInput" TEXT,
                    "language" TEXT,
                    "indent" INT
                );
        """
            )
        )

        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS elements (
                    "id" UUID PRIMARY KEY,
                    "threadId" UUID,
                    "type" TEXT,
                    "url" TEXT,
                    "chainlitKey" TEXT,
                    "name" TEXT NOT NULL,
                    "display" TEXT,
                    "objectKey" TEXT,
                    "size" TEXT,
                    "page" INT,
                    "language" TEXT,
                    "forId" UUID,
                    "mime" TEXT
                );
        """
            )
        )

        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS feedbacks (
                    "id" UUID PRIMARY KEY,
                    "forId" UUID NOT NULL,
                    "threadId" UUID NOT NULL,
                    "value" INT NOT NULL,
                    "comment" TEXT
                );
        """
            )
        )

    # Create SQLAlchemyDataLayer instance
    data_layer = SQLAlchemyDataLayer(conninfo, storage_provider=mock_storage_client)

    return data_layer


async def test_create_and_get_element(
    mock_chainlit_context, data_layer: SQLAlchemyDataLayer
):
    async with mock_chainlit_context:
        text_element = Text(
            id=str(uuid.uuid4()),
            name="test.txt",
            mime="text/plain",
            content="test content",
            for_id="test_step_id",
        )

        # Needs context because of wrapper in utils.py
        await data_layer.create_element(text_element)

    retrieved_element = await data_layer.get_element(
        text_element.thread_id, text_element.id
    )
    assert retrieved_element is not None
    assert retrieved_element["id"] == text_element.id
    assert retrieved_element["name"] == text_element.name
    assert retrieved_element["mime"] == text_element.mime
    # The 'content' field is not part of the ElementDict, so we remove this assertion


async def test_get_current_timestamp(data_layer: SQLAlchemyDataLayer):
    timestamp = await data_layer.get_current_timestamp()
    assert isinstance(timestamp, str)


async def test_get_user(test_user: User, data_layer: SQLAlchemyDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    fetched_user = await data_layer.get_user(persisted_user.identifier)

    assert fetched_user
    assert fetched_user.createdAt == persisted_user.createdAt
    assert fetched_user.id == persisted_user.id

    nonexistent_user = await data_layer.get_user("nonexistent")
    assert nonexistent_user is None


async def test_create_user(test_user: User, data_layer: SQLAlchemyDataLayer):
    persisted_user = await data_layer.create_user(test_user)

    assert persisted_user
    assert persisted_user.identifier == test_user.identifier
    assert persisted_user.createdAt
    assert persisted_user.id

    # Assert id is valid uuid
    assert uuid.UUID(persisted_user.id)


async def test_update_thread(test_user: User, data_layer: SQLAlchemyDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    await data_layer.update_thread("test_thread")


async def test_get_thread_author(test_user: User, data_layer: SQLAlchemyDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    await data_layer.update_thread("test_thread", user_id=persisted_user.id)
    author = await data_layer.get_thread_author("test_thread")

    assert author == persisted_user.identifier


async def test_get_thread(test_user: User, data_layer: SQLAlchemyDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    await data_layer.update_thread("test_thread")
    result = await data_layer.get_thread("test_thread")
    assert result is not None

    result = await data_layer.get_thread("nonexisting_thread")
    assert result is None


async def test_delete_thread(test_user: User, data_layer: SQLAlchemyDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    await data_layer.update_thread("test_thread", "test_user")
    await data_layer.delete_thread("test_thread")
    thread = await data_layer.get_thread("test_thread")
    assert thread is None


async def _get_thread_metadata_raw(
    data_layer: SQLAlchemyDataLayer, thread_id: str
) -> str | None:
    result = await data_layer.execute_sql(
        query='SELECT "metadata" FROM threads WHERE "id" = :id',
        parameters={"id": thread_id},
    )
    if isinstance(result, list) and result:
        return result[0].get("metadata")
    return None


async def test_update_thread_without_metadata_stores_empty_dict(
    data_layer: SQLAlchemyDataLayer,
):
    await data_layer.update_thread("thread_no_meta")

    raw = await _get_thread_metadata_raw(data_layer, "thread_no_meta")
    assert raw is not None
    assert json.loads(raw) == {}


async def test_update_thread_with_explicit_metadata(
    data_layer: SQLAlchemyDataLayer,
):
    await data_layer.update_thread(
        "thread_meta", metadata={"key": "value", "count": 42}
    )

    raw = await _get_thread_metadata_raw(data_layer, "thread_meta")
    assert raw is not None
    assert json.loads(raw) == {"key": "value", "count": 42}


async def test_update_thread_with_empty_metadata(
    data_layer: SQLAlchemyDataLayer,
):
    await data_layer.update_thread("thread_empty_meta", metadata={})

    raw = await _get_thread_metadata_raw(data_layer, "thread_empty_meta")
    assert raw is not None
    assert json.loads(raw) == {}


async def test_update_thread_preserves_metadata_on_noop_call(
    data_layer: SQLAlchemyDataLayer,
):
    await data_layer.update_thread("thread_preserve", metadata={"important": "data"})

    await data_layer.update_thread("thread_preserve")

    raw = await _get_thread_metadata_raw(data_layer, "thread_preserve")
    assert raw is not None
    assert json.loads(raw) == {"important": "data"}


async def test_update_thread_merges_metadata(
    data_layer: SQLAlchemyDataLayer,
):
    await data_layer.update_thread(
        "thread_merge", metadata={"existing": "old", "keep": "me"}
    )

    await data_layer.update_thread(
        "thread_merge", metadata={"existing": "new", "added": "field"}
    )

    raw = await _get_thread_metadata_raw(data_layer, "thread_merge")
    assert raw is not None
    merged = json.loads(raw)
    assert merged == {"existing": "new", "keep": "me", "added": "field"}


async def test_update_thread_deletes_metadata_keys_via_none(
    data_layer: SQLAlchemyDataLayer,
):
    await data_layer.update_thread(
        "thread_delete_key", metadata={"a": 1, "b": 2, "c": 3}
    )

    await data_layer.update_thread("thread_delete_key", metadata={"b": None})

    raw = await _get_thread_metadata_raw(data_layer, "thread_delete_key")
    assert raw is not None
    result = json.loads(raw)
    assert result == {"a": 1, "c": 3}


async def test_update_thread_name_update_preserves_metadata(
    data_layer: SQLAlchemyDataLayer,
):
    await data_layer.update_thread("thread_name_meta", metadata={"saved": True})

    await data_layer.update_thread("thread_name_meta", name="New Name")

    raw = await _get_thread_metadata_raw(data_layer, "thread_name_meta")
    assert raw is not None
    assert json.loads(raw) == {"saved": True}

    result = await data_layer.execute_sql(
        query='SELECT "name" FROM threads WHERE "id" = :id',
        parameters={"id": "thread_name_meta"},
    )
    assert isinstance(result, list)
    assert result
    assert result[0]["name"] == "New Name"
