import uuid
from pathlib import Path

import pytest
from chainlit.data.base import BaseStorageClient
from chainlit.data.sql_alchemy_orm import SQLAlchemyORMDataLayer
from chainlit.element import Text

from chainlit import User


@pytest.fixture
async def data_layer(mock_storage_client: BaseStorageClient, tmp_path: Path):
    db_file = tmp_path / "test_db.sqlite"
    conninfo = f"sqlite+aiosqlite:///{db_file}"

    # Create SQLAlchemyORMDataLayer instance
    data_layer = SQLAlchemyORMDataLayer(
        conninfo, storage_provider=mock_storage_client, log_level="DEBUG"
    )

    await data_layer.create_objects()

    yield data_layer


@pytest.fixture
def test_user() -> User:
    return User(identifier="sqlalchemy_test_user_id")


async def test_create_and_get_element(
    mock_chainlit_context, data_layer: SQLAlchemyORMDataLayer
):
    async with mock_chainlit_context:
        text_element = Text(
            id=str(uuid.uuid4()),
            name="test.txt",
            mime="text/plain",
            content="test content",
            for_id=str(uuid.uuid4()),
        )
        from chainlit import logger

        logger.info(f"thread_id={text_element.thread_id}")

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


async def test_get_current_timestamp(data_layer: SQLAlchemyORMDataLayer):
    timestamp = await data_layer.get_current_timestamp()
    assert isinstance(timestamp, str)


async def test_get_user(test_user: User, data_layer: SQLAlchemyORMDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    fetched_user = await data_layer.get_user(persisted_user.identifier)

    assert fetched_user
    assert fetched_user.createdAt == persisted_user.createdAt
    assert fetched_user.id == persisted_user.id

    nonexistent_user = await data_layer.get_user("nonexistent")
    assert nonexistent_user is None


async def test_create_user(test_user: User, data_layer: SQLAlchemyORMDataLayer):
    persisted_user = await data_layer.create_user(test_user)

    assert persisted_user
    assert persisted_user.identifier == test_user.identifier
    assert persisted_user.createdAt
    assert persisted_user.id

    # Assert id is valid uuid
    assert uuid.UUID(persisted_user.id)


async def test_update_thread(test_user: User, data_layer: SQLAlchemyORMDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    thread_id = str(uuid.uuid4())

    await data_layer.update_thread(thread_id)


async def test_get_thread_author(test_user: User, data_layer: SQLAlchemyORMDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    thread_id = str(uuid.uuid4())

    await data_layer.update_thread(thread_id, user_id=persisted_user.id)
    author = await data_layer.get_thread_author(thread_id)

    assert author == persisted_user.identifier


async def test_get_thread(test_user: User, data_layer: SQLAlchemyORMDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    thread_id = str(uuid.uuid4())

    await data_layer.update_thread(thread_id)
    result = await data_layer.get_thread(thread_id)
    assert result is not None

    result = await data_layer.get_thread("nonexisting_thread")
    assert result is None


async def test_delete_thread(test_user: User, data_layer: SQLAlchemyORMDataLayer):
    persisted_user = await data_layer.create_user(test_user)
    assert persisted_user

    thread_id = str(uuid.uuid4())

    await data_layer.update_thread(thread_id, "test_user")
    await data_layer.delete_thread(thread_id)
    thread = await data_layer.get_thread(thread_id)
    assert thread is None
