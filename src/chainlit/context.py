import contextvars
from asyncio import AbstractEventLoop
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from chainlit.emitter import ChainlitEmitter


class ChainlitContextException(Exception):
    def __init__(self, msg="Chainlit context not found", *args, **kwargs):
        super().__init__(msg, *args, **kwargs)


emitter_var = contextvars.ContextVar("emitter")
loop_var = contextvars.ContextVar("loop")


def get_emitter() -> "ChainlitEmitter":
    try:
        return emitter_var.get()
    except LookupError:
        raise ChainlitContextException()


def get_loop() -> AbstractEventLoop:
    try:
        return loop_var.get()
    except LookupError:
        raise ChainlitContextException()
