"""Tests for chainlit._reentrant_loop.run_coroutine_reentrant.

The module drives a nested run of the *already running* event loop by
suspending the calling task around it. These tests pin the behaviour that
makes that safe -- the outer task is restored, other work still progresses,
nothing in asyncio is mutated -- plus the private APIs the technique depends
on, so a future Python removing one fails here rather than silently
misbehaving at runtime.
"""

import asyncio
import sys

import anyio
import pytest

from chainlit._reentrant_loop import run_coroutine_reentrant


async def _return(value):
    return value


async def test_returns_the_nested_coroutine_result():
    loop = asyncio.get_running_loop()

    assert run_coroutine_reentrant(loop, _return("nested")) == "nested"


async def test_nested_coroutine_sees_its_own_task():
    """The outer task is suspended for the nested run, so current_task() must
    report the nested task while it runs -- not None, which is what breaks
    anyio."""
    loop = asyncio.get_running_loop()
    outer_task = asyncio.current_task()

    async def inner():
        return asyncio.current_task()

    inner_task = run_coroutine_reentrant(loop, inner())

    assert inner_task is not None
    assert inner_task is not outer_task


async def test_outer_task_is_restored_afterwards():
    loop = asyncio.get_running_loop()
    outer_task = asyncio.current_task()

    run_coroutine_reentrant(loop, _return("noop"))

    assert asyncio.current_task() is outer_task


async def test_outer_task_is_restored_when_the_coroutine_raises():
    loop = asyncio.get_running_loop()
    outer_task = asyncio.current_task()

    async def boom():
        raise ValueError("nested failure")

    with pytest.raises(ValueError, match="nested failure"):
        run_coroutine_reentrant(loop, boom())

    assert asyncio.current_task() is outer_task


async def test_other_tasks_keep_running_during_the_nested_run():
    """The nested run calls the stdlib scheduler rather than draining only its
    own future, so a task scheduled beforehand must still make progress."""
    loop = asyncio.get_running_loop()
    ticks = 0

    async def ticker():
        nonlocal ticks
        while True:
            ticks += 1
            await asyncio.sleep(0)

    background = asyncio.ensure_future(ticker())
    try:

        async def slow():
            await asyncio.sleep(0.05)
            return "slow-done"

        assert run_coroutine_reentrant(loop, slow()) == "slow-done"
        assert ticks > 0
    finally:
        background.cancel()


async def test_anyio_task_group_works_inside_the_nested_run():
    """The regression that ruled out nest_asyncio.apply(): anyio weak-references
    asyncio.current_task(), so a task group nested inside run_sync() fails as
    soon as task tracking is inconsistent."""
    loop = asyncio.get_running_loop()
    collected = []

    async def uses_task_group():
        async with anyio.create_task_group() as tg:
            tg.start_soon(_collect, collected, "a")
            tg.start_soon(_collect, collected, "b")
        return "task-group-ok"

    assert run_coroutine_reentrant(loop, uses_task_group()) == "task-group-ok"
    assert sorted(collected) == ["a", "b"]


async def _collect(sink, value):
    await asyncio.sleep(0)
    sink.append(value)


async def test_anyio_task_group_still_works_in_the_outer_task_afterwards():
    loop = asyncio.get_running_loop()
    run_coroutine_reentrant(loop, _return("noop"))

    collected = []
    async with anyio.create_task_group() as tg:
        tg.start_soon(_collect, collected, "after")

    assert collected == ["after"]


async def test_nothing_in_asyncio_is_globally_patched():
    """Unlike nest_asyncio, this technique mutates no asyncio global, no class
    and no loop instance. Asserted directly so a regression toward patching is
    caught."""
    import _asyncio

    loop = asyncio.get_running_loop()
    loop_class = type(loop)

    run_coroutine_reentrant(loop, _return("noop"))

    assert asyncio.Task is _asyncio.Task
    assert asyncio.Future is _asyncio.Future
    assert type(loop) is loop_class
    assert not hasattr(loop_class, "_nest_patched")


def test_private_apis_relied_on_exist_on_this_interpreter():
    """A contract test for the private APIs documented in the module docstring.

    Python 3.14 silently emptied asyncio.tasks._current_tasks, which is exactly
    the kind of change that must fail loudly here.
    """
    loop = asyncio.new_event_loop()
    try:
        assert hasattr(loop, "_run_once")
        assert hasattr(loop, "_stopping")
    finally:
        loop.close()

    if sys.version_info >= (3, 12):
        import _asyncio

        assert hasattr(_asyncio, "_swap_current_task")
    else:
        assert isinstance(asyncio.tasks._current_tasks, dict)


async def test_current_task_store_is_the_one_the_interpreter_reads():
    """The suspension primitive must reach the store asyncio.current_task()
    actually consults; on 3.14 the _current_tasks dict no longer is that store.
    """
    task = asyncio.current_task()

    if sys.version_info >= (3, 12):
        from _asyncio import _swap_current_task

        loop = asyncio.get_running_loop()
        previous = _swap_current_task(loop, None)
        try:
            assert previous is task
            assert asyncio.current_task() is None
        finally:
            _swap_current_task(loop, previous)
    else:
        assert asyncio.tasks._current_tasks[asyncio.get_running_loop()] is task

    assert asyncio.current_task() is task
