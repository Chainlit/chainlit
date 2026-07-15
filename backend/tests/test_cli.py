"""Regression tests for chainlit.cli import behaviour.

Ensures nest_asyncio is not imported by chainlit.cli.

Background
----------
nest_asyncio ≤ 1.6.0 patches ``asyncio.BaseEventLoop.run_until_complete`` via
``asyncio.ensure_future(future, loop=self)``.  The ``loop=`` keyword was
deprecated in Python 3.8 and **removed in Python 3.14** (bpo-39529).  When
``nest_asyncio.apply()`` ran at module-import time it silently corrupted asyncio
task registration: ``asyncio.current_task()`` returned ``None`` inside running
coroutines, causing ``anyio.NoEventLoopError`` on every static-asset request
and a white screen for users on Python 3.14.

See https://github.com/Chainlit/chainlit/issues/2767
"""

import chainlit.cli


def test_nest_asyncio_not_in_cli_namespace():
    """chainlit.cli must not expose nest_asyncio in its module namespace.

    If ``import nest_asyncio`` is ever re-added to cli/__init__.py this test
    will fail immediately, preventing the Python 3.14 regression from
    being reintroduced.
    """
    assert not hasattr(chainlit.cli, "nest_asyncio"), (
        "chainlit.cli exposes 'nest_asyncio' in its namespace. "
        "Remove 'import nest_asyncio' and 'nest_asyncio.apply()' from "
        "backend/chainlit/cli/__init__.py — nest_asyncio breaks Python 3.14 "
        "via the removed loop= kwarg in asyncio.ensure_future (bpo-39529)."
    )
