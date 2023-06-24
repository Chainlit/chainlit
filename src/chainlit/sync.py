from typing import Any, Callable

import asyncio
from syncer import sync
from asyncer import asyncify

from chainlit.emitter import get_emitter
from chainlit.context import loop_var


def make_async(function: Callable):
    emitter = get_emitter()
    if not emitter:
        raise RuntimeError(
            "Emitter not found, please call make_async in a Chainlit context."
        )

    def wrapper(*args, **kwargs):
        emitter.session["running_sync"] = True
        res = function(*args, **kwargs)
        emitter.session["running_sync"] = False
        return res

    return asyncify(wrapper, cancellable=True)


def run_sync(co: Any):
    loop = loop_var.get()
    result = asyncio.run_coroutine_threadsafe(co, loop=loop)
    return result.result()
