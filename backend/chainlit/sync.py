import asyncio
import sys
import threading
from typing import Any, Coroutine, ParamSpec, TypeVar

from asyncer import asyncify
from syncer import sync

from chainlit.context import context_var

make_async = asyncify

T_Retval = TypeVar("T_Retval")
T_ParamSpec = ParamSpec("T_ParamSpec")
T = TypeVar("T")

# run_sync() called from the main thread re-enters an already-running event
# loop, which asyncio forbids. nest_asyncio lifts that restriction, but only
# its loop patch is safe to use here: nest_asyncio.apply() additionally calls
# _patch_asyncio(), which rebinds asyncio.Task/Future to the pure Python
# implementations while asyncio.current_task stays bound to the C accelerator.
# current_task() then returns None inside running coroutines, and anyio -- which
# takes a weak reference to it -- raises NoEventLoopError. Patching the loop
# alone leaves both the C task classes and current_task() intact.
#
# On Python 3.14 the loop patch is no longer sufficient: the C-level task
# registry refuses to enter a task while another one is running, so the loop
# wedges rather than raising. Only the global Task swap bypasses that check,
# and that swap is precisely what breaks anyio -- so main-thread re-entrancy
# cannot be offered on 3.14+ at any acceptable cost.
_SUPPORTS_REENTRANT_LOOP = sys.version_info < (3, 14)

_REENTRANCY_UNAVAILABLE = (
    "cl.run_sync() cannot run a coroutine from the main thread while the event "
    "loop is running on Python 3.14+, because the event loop cannot be made "
    "re-entrant without breaking asyncio task tracking. Either await the "
    "coroutine directly, or move the calling synchronous function off the main "
    "thread with cl.make_async(fn)() -- cl.run_sync() still works from there."
)


def _ensure_reentrant_loop() -> None:
    """Allow the running event loop to be re-entered, where that is possible.

    No-op when no loop is running: ``syncer.sync()`` then drives the loop
    itself and needs no patch.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return

    if not _SUPPORTS_REENTRANT_LOOP:
        raise RuntimeError(_REENTRANCY_UNAVAILABLE)

    # Imported lazily: nest_asyncio is only a dependency below Python 3.14.
    import nest_asyncio

    # Deliberately not nest_asyncio.apply() -- see the note above. _patch_loop
    # is idempotent; it returns early once the loop carries _nest_patched.
    nest_asyncio._patch_loop(loop)


def run_sync(co: Coroutine[Any, Any, T_Retval]) -> T_Retval:
    """Run the coroutine synchronously."""

    # Copy the current context
    current_context = context_var.get()

    # Define a wrapper coroutine that sets the context before running the original coroutine
    async def context_preserving_coroutine():
        # Set the copied context to the coroutine
        context_var.set(current_context)
        return await co

    # Execute from the main thread in the main event loop
    if threading.current_thread() == threading.main_thread():
        try:
            _ensure_reentrant_loop()
        except RuntimeError:
            # Close the caller's coroutine so the failure surfaces as this
            # error alone, rather than trailing a confusing
            # "coroutine was never awaited" RuntimeWarning behind it.
            co.close()
            raise
        return sync(context_preserving_coroutine())
    else:  # Execute from a thread in the main event loop
        result = asyncio.run_coroutine_threadsafe(
            context_preserving_coroutine(), loop=current_context.loop
        )
        return result.result()
