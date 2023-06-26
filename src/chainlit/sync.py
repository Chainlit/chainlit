import sys
from typing import Any, TypeVar, Coroutine

if sys.version_info >= (3, 10):
    from typing import ParamSpec
else:
    from typing_extensions import ParamSpec

import threading
import asyncio
from syncer import sync
from asyncer import asyncify

from chainlit.context import get_loop


make_async = asyncify

T_Retval = TypeVar("T_Retval")
T_ParamSpec = ParamSpec("T_ParamSpec")
T = TypeVar("T")


def run_sync(co: Coroutine[Any, Any, T_Retval]) -> T_Retval:
    if threading.current_thread() == threading.main_thread():
        return sync(co)
    else:
        loop = get_loop()
        result = asyncio.run_coroutine_threadsafe(co, loop=loop)
        return result.result()
