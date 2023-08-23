import asyncio
from contextvars import ContextVar
from typing import TYPE_CHECKING

from lazify import LazyProxy

from chainlit.session import Session

if TYPE_CHECKING:
    from chainlit.emitter import ChainlitEmitter


class ChainlitContextException(Exception):
    def __init__(self, msg="Chainlit context not found", *args, **kwargs):
        super().__init__(msg, *args, **kwargs)


class ChainlitContext:
    loop: asyncio.AbstractEventLoop
    emitter: "ChainlitEmitter"
    session: Session

    def __init__(self, session: Session):
        from chainlit.emitter import ChainlitEmitter

        self.loop = asyncio.get_running_loop()
        self.session = session
        self.emitter = ChainlitEmitter(session)


context_var: ContextVar[ChainlitContext] = ContextVar("chainlit")


def init_context(session_or_sid) -> ChainlitContext:
    if not isinstance(session_or_sid, Session):
        session_or_sid = Session.require(session_or_sid)

    context = ChainlitContext(session_or_sid)
    context_var.set(context)
    return context


def get_context() -> ChainlitContext:
    try:
        return context_var.get()
    except LookupError:
        raise ChainlitContextException()


context: ChainlitContext = LazyProxy(get_context, enable_cache=False)
