"""Regression tests for chainlit.cli import behaviour.

Ensures nest_asyncio is not applied globally by chainlit.cli.

Background
----------
``nest_asyncio.apply()`` rebinds ``asyncio.Task`` and ``asyncio.Future`` to
their pure Python implementations, while ``asyncio.current_task`` stays bound
to the C accelerator.  ``current_task()`` therefore returns ``None`` inside
running coroutines, and anyio -- which takes a weak reference to it -- raises
``anyio.NoEventLoopError`` on every static-asset request, giving users a white
screen.  On Python 3.14 the C-level task registry makes this rebind the only
way to obtain a re-entrant loop, so the failure became unavoidable there.

Re-entrancy that is genuinely needed is provided in ``chainlit/sync.py`` by
patching the running loop alone, which leaves the task classes untouched.

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
        "backend/chainlit/cli/__init__.py — applying it globally rebinds "
        "asyncio.Task/Future and breaks anyio via current_task() returning None."
    )


def test_asyncio_task_not_globally_patched():
    """Importing chainlit.cli must leave the C task implementation in place.

    This asserts the actual invariant that matters, rather than the absence of
    one particular import: whatever chainlit.cli does, asyncio.Task must still
    be the C accelerator class that asyncio.current_task() agrees with.
    """
    import asyncio

    assert asyncio.Task.__module__ == "_asyncio", (
        f"asyncio.Task is {asyncio.Task!r}, expected the C implementation. "
        "Something imported by chainlit.cli has swapped in the pure Python "
        "task class, which desynchronises asyncio.current_task() and breaks "
        "anyio."
    )
