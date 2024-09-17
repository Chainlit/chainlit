import abc
import dataclasses as dc

import pytest
from chainlit.context import ChainlitContext

from chainlit import User

max_size = 10


@dc.dataclass
class DummyChainlitContext(ChainlitContext):
    user: User

    def __post_init__(self):
        pass

    @property
    def session(self):
        return self


class CheckDB:
    @pytest.fixture()
    @abc.abstractmethod
    def data_layer(self, tmp_files_folder):
        pass

    @pytest.mark.asyncio
    async def test_get_current_timestamp(self, data_layer):
        timestamp = await data_layer.get_current_timestamp()
        assert isinstance(timestamp, str)

    @pytest.mark.asyncio
    async def test_get_user(self, data_layer):
        result = await data_layer.get_user("test_id")
        assert result is None

    @pytest.mark.asyncio
    async def test_create_user(self, data_layer):
        user = User("test_user")
        result = await data_layer.create_user(user)
        assert result is not None

    @pytest.mark.asyncio
    async def test_get_thread_author(self, data_layer):
        _ = await data_layer.update_thread("test_thread", "test_user")
        author = await data_layer.get_thread_author("test_thread")
        assert author == "test_user"

    @pytest.mark.asyncio
    async def test_get_thread(self, data_layer):
        result = await data_layer.get_thread("test_thread")
        assert result is None

    @pytest.mark.asyncio
    async def test_update_thread(self, data_layer):
        await data_layer.update_thread("test_thread", "test_user")
        assert True

    @pytest.mark.asyncio
    async def test_delete_thread(self, data_layer):
        await data_layer.update_thread("test_thread", "test_user")
        await data_layer.delete_thread("test_thread")
        thread = await data_layer.get_thread("test_thread")
        assert thread is None
        assert True
