import asyncio
import threading
from typing import Any, Coroutine, ParamSpec, TypeVar

from asyncer import asyncify
from syncer import sync

from chainlit._reentrant_loop import run_coroutine_reentrant
from chainlit.context import context_var

make_async = asyncify

T_Retval = TypeVar("T_Retval")
T_ParamSpec = ParamSpec("T_ParamSpec")
T = TypeVar("T")


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
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # No loop is running, so there is nothing to re-enter: syncer
            # drives a loop of its own to completion.
            return sync(context_preserving_coroutine())

        # The loop is already running and we are on its thread, which rules
        # out both run_until_complete and run_coroutine_threadsafe.
        return run_coroutine_reentrant(loop, context_preserving_coroutine())
    else:  # Execute from a thread in the main event loop
        result = asyncio.run_coroutine_threadsafe(
            context_preserving_coroutine(), loop=current_context.loop
        )
        return result.result()
