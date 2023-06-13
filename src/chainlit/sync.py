from typing import Any, Callable

import asyncio
from syncer import sync
from asyncer import asyncify

from chainlit.emitter import get_emitter


def make_async(function: Callable):
    emitter = get_emitter()
    if not emitter:
        raise RuntimeError(
            "Emitter not found, please call make_async in a Chainlit context."
        )

    def wrapper(*args, **kwargs):
        emitter.session["running_sync"] = True
        __chainlit_emitter__ = emitter
        res = function(*args, **kwargs)
        emitter.session["running_sync"] = False
        return res

    return asyncify(wrapper, cancellable=True)


def run_sync(co: Any):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError as e:
        if "There is no current event loop" in str(e):
            loop = None

    if loop is None or not loop.is_running():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return sync(co)
