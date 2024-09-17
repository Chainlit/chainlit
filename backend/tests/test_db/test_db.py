import asyncio

import pytest
from chainlit.data.suites.checks_suites import CheckDB, DummyChainlitContext

import chainlit as cl

from .builder import CustomDataLayer, build_db


class TestSQLiteDB(CheckDB):
    @pytest.fixture()
    def data_layer(self, tmp_files_folder):
        db_path = tmp_files_folder / "test.db"
        asyncio.run(build_db(f"sqlite+aiosqlite:///{db_path.as_posix()}"))
        return CustomDataLayer(
            f"sqlite+aiosqlite:///{db_path.as_posix()}",
            context=DummyChainlitContext(user=cl.User(identifier="test_user")),
        )
