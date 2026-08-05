"""Regression test for chainlit.cli import behaviour.

``nest_asyncio.apply()`` rebinds ``asyncio.Task`` and ``asyncio.Future`` to
their pure Python implementations, while ``asyncio.current_task`` stays bound
to the C accelerator.  ``current_task()`` therefore returns ``None`` inside
running coroutines, and anyio -- which takes a weak reference to it -- raises
``anyio.NoEventLoopError`` on every static-asset request, giving users a white
screen.

nest_asyncio is no longer a dependency: the re-entrancy that is genuinely
needed is provided by ``chainlit/_reentrant_loop.py``, which mutates nothing in
asyncio.  This test keeps the global-patch regression from being reintroduced
by any future import.

See https://github.com/Chainlit/chainlit/issues/2767
"""

import chainlit.cli  # noqa: F401  -- imported for its global side effects


def test_asyncio_task_not_globally_patched():
    """Importing chainlit.cli must leave the C task implementation in place.

    This asserts the invariant that matters rather than the absence of one
    particular import: whatever chainlit.cli pulls in, asyncio.Task must still
    be the C accelerator class that asyncio.current_task() agrees with.
    """
    import asyncio

    assert asyncio.Task.__module__ == "_asyncio", (
        f"asyncio.Task is {asyncio.Task!r}, expected the C implementation. "
        "Something imported by chainlit.cli has swapped in the pure Python "
        "task class, which desynchronises asyncio.current_task() and breaks "
        "anyio."
    )
