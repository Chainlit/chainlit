"""Tests for chainlit.sync.run_sync, covering both dispatch branches and the
Python 3.14+ error path.

Background: chainlit.sync._ensure_reentrant_loop() (backend/chainlit/sync.py)
patches the running loop with nest_asyncio._patch_loop() rather than calling
nest_asyncio.apply(), because apply() rebinds asyncio.Task/Future globally
and that breaks anyio's current_task()-based bookkeeping. On Python 3.14+
that patch no longer makes the loop reentrant (the C task registry refuses to
enter a task while another one is running), so run_sync() raises an
actionable error there instead of hanging. See chainlit_pr_briefs for the
full mechanism and the scripts that isolated it.
"""

import asyncio
import contextvars
import re
import sys
import threading

import pytest

from chainlit.sync import _REENTRANCY_UNAVAILABLE, run_sync


async def _return(value):
    return value


async def test_run_sync_from_main_thread_reentrant(mock_chainlit_context):
    """The common case: a sync function called from the main thread while
    the event loop is already running (e.g. a sync @cl.step invoked directly
    from an async handler)."""
    async with mock_chainlit_context:
        assert run_sync(_return("main-thread-ok")) == "main-thread-ok"


async def test_run_sync_from_main_thread_is_idempotent(mock_chainlit_context):
    """nest_asyncio._patch_loop guards on loop._nest_patched (verified via
    inspect.getsource in the PR's verify scripts) -- calling run_sync twice
    from the main thread must not raise on the second call."""
    async with mock_chainlit_context:
        assert run_sync(_return("first")) == "first"
        assert run_sync(_return("second")) == "second"


async def test_run_sync_patches_the_loop_class_not_the_instance(
    mock_chainlit_context,
):
    """nest_asyncio._patch_loop assigns to loop.__class__, so the reentrancy
    it grants is not scoped to a single loop instance -- it persists for every
    loop of that class for the remainder of the process. This is a documented
    property of the fix (see the comment in chainlit/sync.py), not scoped-per-
    call, and is worth asserting explicitly so a future change to the patch
    target is noticed."""
    async with mock_chainlit_context:
        loop = asyncio.get_running_loop()
        run_sync(_return("noop"))
        assert getattr(type(loop), "_nest_patched", False) is True


async def test_run_sync_from_worker_thread(mock_chainlit_context):
    """The other dispatch branch: called from a worker thread (e.g. inside
    cl.make_async(fn)()) while the main thread owns the running loop. Uses
    asyncio.to_thread rather than a bare Thread + join so the loop keeps
    running concurrently -- run_coroutine_threadsafe requires that, and a
    blocking join on the loop's own thread would deadlock."""
    async with mock_chainlit_context:
        current_ctx = contextvars.copy_context()

        def worker():
            return current_ctx.run(run_sync, _return("worker-thread-ok"))

        assert threading.current_thread() is not threading.main_thread
        result = await asyncio.to_thread(worker)
        assert result == "worker-thread-ok"


async def test_run_sync_on_314_raises_actionable_error(
    mock_chainlit_context, monkeypatch: pytest.MonkeyPatch
):
    """Python 3.14+ cannot be exercised directly by the test matrix (it runs
    under 3.13 -- see backend/pyproject.toml requires-python), so the version
    gate is simulated by monkeypatching the module-level flag rather than
    sys.version_info, keeping the test independent of the interpreter it
    actually runs under."""
    async with mock_chainlit_context:
        monkeypatch.setattr(
            "chainlit.sync._SUPPORTS_REENTRANT_LOOP",
            False,
        )
        coro = _return("unreachable")

        with pytest.raises(RuntimeError, match=re.escape(_REENTRANCY_UNAVAILABLE)):
            run_sync(coro)

        # The coroutine must be closed rather than left dangling, or the
        # caller gets a confusing extra "coroutine was never awaited"
        # RuntimeWarning trailing the real error (this is what run_sync's
        # main-thread branch does on the error path -- see sync.py).
        assert coro.cr_frame is None, (
            "run_sync must close the coroutine before raising on the 3.14+ error path"
        )


async def test_run_sync_worker_thread_path_ignores_the_314_gate(
    mock_chainlit_context, monkeypatch: pytest.MonkeyPatch
):
    """The reentrancy restriction is specific to the main-thread branch
    (asyncio.get_running_loop().run_until_complete via syncer.sync). The
    worker-thread branch uses run_coroutine_threadsafe, which never needed
    nest_asyncio and must keep working unconditionally, including on 3.14+."""
    async with mock_chainlit_context:
        monkeypatch.setattr(
            "chainlit.sync._SUPPORTS_REENTRANT_LOOP",
            False,
        )
        current_ctx = contextvars.copy_context()

        def worker():
            return current_ctx.run(run_sync, _return("worker-thread-314-ok"))

        result = await asyncio.to_thread(worker)
        assert result == "worker-thread-314-ok"


def test_supports_reentrant_loop_flag_matches_running_interpreter():
    """Guards against the flag drifting from the version boundary it exists
    to encode."""
    from chainlit.sync import _SUPPORTS_REENTRANT_LOOP

    assert _SUPPORTS_REENTRANT_LOOP == (sys.version_info < (3, 14))
