import sys
from typing import Any, Coroutine, TypeVar

if sys.version_info >= (3, 10):
    from typing import ParamSpec
else:
    from typing_extensions import ParamSpec

import asyncio
import threading

from asyncer import asyncify
from syncer import sync

from chainlit.context import context

make_async = asyncify

T_Retval = TypeVar("T_Retval")
T_ParamSpec = ParamSpec("T_ParamSpec")
T = TypeVar("T")


def run_sync(co: Coroutine[Any, Any, T_Retval], force_new_loop=False) -> T_Retval:
    """Run the coroutine synchronously. If force_new_loop is True,
    the coroutine is executed in a new event loop, otherwise it is
    executed in the main event loop."""

    # Execute in a new event loop
    if force_new_loop:
        loop = asyncio.new_event_loop()
        return loop.run_until_complete(co)

    # Execute from the main thread in the main event loop
    if threading.current_thread() == threading.main_thread():
        return sync(co)
    else:  # Execute from a thread in the main event loop
        result = asyncio.run_coroutine_threadsafe(co, loop=context.loop)
        return result.result()
