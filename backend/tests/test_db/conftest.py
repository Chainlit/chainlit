import shutil
from pathlib import Path

import pytest


@pytest.fixture
def tmp_files_folder(test_cleaner) -> Path:
    folder_path = Path(__file__).parent / "tmp_folder_for_tests"
    if folder_path.exists():
        shutil.rmtree(folder_path)
    folder_path.mkdir()
    test_cleaner(lambda: shutil.rmtree(folder_path))
    return folder_path


@pytest.fixture()
def test_cleaner():
    funcs = []

    def add_func(func):
        funcs.append(func)

    yield add_func
    for func in funcs:
        func()
