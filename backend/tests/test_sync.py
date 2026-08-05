"""Tests for chainlit.sync.run_sync, covering both dispatch branches.

Background: run_sync() called from the main thread while the loop is already
running must re-enter that loop. It does so via
chainlit._reentrant_loop.run_coroutine_reentrant (tested in
test_reentrant_loop.py) rather than nest_asyncio, whose apply() rebinds
asyncio.Task/Future globally and thereby breaks anyio's current_task()-based
bookkeeping.
"""

import asyncio
import contextvars
import threading
import warnings

from chainlit.sync import run_sync


async def _return(value):
    return value


async def test_run_sync_from_main_thread_reentrant(mock_chainlit_context):
    """The common case: a sync function called from the main thread while
    the event loop is already running (e.g. a sync @cl.step invoked directly
    from an async handler)."""
    async with mock_chainlit_context:
        assert run_sync(_return("main-thread-ok")) == "main-thread-ok"


async def test_run_sync_from_main_thread_is_repeatable(mock_chainlit_context):
    """Re-entrancy is established per call, with no state carried between
    calls -- two calls in a row must both succeed."""
    async with mock_chainlit_context:
        assert run_sync(_return("first")) == "first"
        assert run_sync(_return("second")) == "second"


def test_run_sync_without_a_running_loop():
    """Outside any loop there is nothing to re-enter; run_sync falls back to
    syncer, which drives a loop of its own."""
    from chainlit.context import ChainlitContext, context_var
    from chainlit.session import HTTPSession

    # ChainlitContext captures the running loop at construction, so it is built
    # inside one and then used from the main thread with the loop stopped --
    # exactly the shape of the fallback branch, where syncer.sync() reaches for
    # the thread's current loop via asyncio.get_event_loop().
    async def build_context():
        session = HTTPSession(id="test-no-loop", user_env={}, client_type="webapp")
        return ChainlitContext(session)

    # Leave this thread with a usable ambient loop afterwards. A bare
    # asyncio.set_event_loop(None) in the finally below leaks into any later
    # test that calls asyncio.get_event_loop(), which then raises "There is no
    # current event loop in thread 'MainThread'". Note get_event_loop() here
    # creates the loop if the thread has none yet, which is the state we want
    # to restore to either way.
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        try:
            previous_loop = asyncio.get_event_loop_policy().get_event_loop()
        except RuntimeError:
            previous_loop = None

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    token = None
    try:
        token = context_var.set(loop.run_until_complete(build_context()))
        assert run_sync(_return("no-loop-ok")) == "no-loop-ok"
    finally:
        # reset(token), not set(None): this is a sync test, so the context var
        # is the ambient one and survives the test. Setting None would leave
        # get_context() returning None for later tests instead of raising
        # ChainlitContextException, which is what an unset var must do.
        if token is not None:
            context_var.reset(token)
        asyncio.set_event_loop(previous_loop)
        loop.close()


async def test_run_sync_from_worker_thread(mock_chainlit_context):
    """The other dispatch branch: called from a worker thread (e.g. inside
    cl.make_async(fn)()) while the main thread owns the running loop. Uses
    asyncio.to_thread rather than a bare Thread + join so the loop keeps
    running concurrently -- run_coroutine_threadsafe requires that, and a
    blocking join on the loop's own thread would deadlock."""
    async with mock_chainlit_context:
        current_ctx = contextvars.copy_context()

        def worker():
            assert threading.current_thread() is not threading.main_thread()
            return current_ctx.run(run_sync, _return("worker-thread-ok"))

        result = await asyncio.to_thread(worker)
        assert result == "worker-thread-ok"
