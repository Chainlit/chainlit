from typing import Any

from syncer import sync
import asyncio


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
