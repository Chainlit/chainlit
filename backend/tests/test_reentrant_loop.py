"""Tests for chainlit._reentrant_loop.run_coroutine_reentrant.

The module drives a nested run of the *already running* event loop by
suspending the calling task around it. These tests pin the behaviour that
makes that safe -- the outer task is restored, other work still progresses,
nothing in asyncio is mutated -- plus the private APIs the technique depends
on, so a future Python removing one fails here rather than silently
misbehaving at runtime.
"""

import asyncio
import collections
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


async def test_anyio_task_group_still_works_in_the_outer_task_afterwards():
    """The other half of the guarantee: restoring asyncio.current_task() is only
    useful if anyio's own per-task state survives the nested run too. anyio keys
    that state on a WeakKeyDictionary of host tasks, so this fails for reasons
    the current_task() identity assertion cannot see."""
    loop = asyncio.get_running_loop()
    run_coroutine_reentrant(loop, _return("noop"))

    collected = []
    async with anyio.create_task_group() as tg:
        tg.start_soon(_collect, collected, "after")

    assert collected == ["after"]


async def _collect(sink, value):
    await asyncio.sleep(0)
    sink.append(value)


async def test_nothing_in_asyncio_is_globally_patched():
    """Unlike nest_asyncio, this technique rebinds no asyncio global and no
    class, and installs nothing persistent on the loop instance. Asserted
    directly so a regression toward patching is caught. The loop's ready queue
    is padded during a nested run (see the module docstring), but that is scoped
    to the run and leaves no residue."""
    import _asyncio

    loop = asyncio.get_running_loop()
    loop_class = type(loop)

    run_coroutine_reentrant(loop, _return("noop"))

    assert asyncio.Task is _asyncio.Task
    assert asyncio.Future is _asyncio.Future
    assert type(loop) is loop_class
    assert not hasattr(loop_class, "_nest_patched")


async def test_private_apis_relied_on_behave_as_the_module_assumes():
    """Contract test for the private APIs documented in the module docstring.

    Asserts not just that the current-task store exists but that it is the one
    asyncio.current_task() actually consults -- Python 3.14 kept
    asyncio.tasks._current_tasks while moving the real store into the thread
    state, and that silent divergence is what broke nest_asyncio.
    """
    loop = asyncio.new_event_loop()
    try:
        assert hasattr(loop, "_run_once")
        assert hasattr(loop, "_stopping")
        # The ready queue must be a deque the module can append to; _run_once
        # pops from its left, so padding on the right is what the compensation
        # in run_coroutine_reentrant depends on.
        assert isinstance(loop._ready, collections.deque)
    finally:
        loop.close()

    task = asyncio.current_task()

    if sys.version_info >= (3, 12):
        from _asyncio import _swap_current_task

        running_loop = asyncio.get_running_loop()
        previous = _swap_current_task(running_loop, None)
        try:
            assert previous is task
            assert asyncio.current_task() is None
        finally:
            _swap_current_task(running_loop, previous)
    else:
        assert isinstance(asyncio.tasks._current_tasks, dict)
        assert asyncio.tasks._current_tasks[asyncio.get_running_loop()] is task

    assert asyncio.current_task() is task


async def test_repays_nothing_when_the_ready_queue_was_empty():
    """The nested task's own first-step handle is scheduled by ensure_future
    after the enclosing _run_once took its snapshot, so it is not owed back.
    Counting it would leave a cancelled handle behind on every single call."""
    loop = asyncio.get_running_loop()

    while loop._ready:
        await asyncio.sleep(0)

    assert run_coroutine_reentrant(loop, _return("noop")) == "noop"

    assert list(loop._ready) == []


async def test_sibling_callbacks_ready_in_the_same_iteration_do_not_underflow():
    """A nested run must not consume the ready-queue budget of the ``_run_once``
    that is driving it.

    ``BaseEventLoop._run_once`` snapshots ``ntodo = len(self._ready)`` and then
    calls ``popleft()`` exactly that many times. A nested run started from one
    of those callbacks drains the queue the enclosing loop is still counting on,
    so without compensation the enclosing ``popleft()`` raises
    ``IndexError: pop from an empty deque`` and kills the loop.

    Two callbacks queued back to back land in the same iteration, which is the
    smallest arrangement that exercises it.
    """
    loop = asyncio.get_running_loop()
    order = []

    async def nested():
        await asyncio.sleep(0)
        return "nested"

    def first():
        order.append(run_coroutine_reentrant(loop, nested()))

    def second():
        order.append("sibling")

    loop.call_soon(first)
    loop.call_soon(second)

    await asyncio.sleep(0.05)

    # The sibling must still run: repaying the borrowed slots with cancelled
    # handles keeps it queued, whereas hiding the queue from the nested run
    # would strand it (and deadlock anything waiting on it).
    assert sorted(order) == ["nested", "sibling"]
