from typing import Any, Callable

import asyncio
from syncer import sync
from asyncer import asyncify as _asyncify

from chainlit.sdk import get_sdk


def asyncify(function: Callable, cancellable: bool = True):
    sdk = get_sdk()
    if not sdk:
        raise RuntimeError("SDK not found, please call asyncify in a Chainlit context.")

    def wrapper(*args, **kwargs):
        __chainlit_sdk__ = sdk
        return function(*args, **kwargs)

    return _asyncify(wrapper, cancellable=cancellable)


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
