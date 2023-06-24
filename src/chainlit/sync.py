from typing import Any, TypeVar, ParamSpec, Coroutine
import asyncio
from asyncer import asyncify

from chainlit.context import get_loop


make_async = asyncify

T_Retval = TypeVar("T_Retval")
T_ParamSpec = ParamSpec("T_ParamSpec")
T = TypeVar("T")


def run_sync(co: Coroutine[Any, Any, T_Retval]) -> T_Retval:
    loop = get_loop()
    result = asyncio.run_coroutine_threadsafe(co, loop=loop)
    return result.result()
