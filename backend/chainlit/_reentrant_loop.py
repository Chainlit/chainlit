"""Run a coroutine to completion from inside a running event loop.

``cl.run_sync()`` is called from synchronous user code that may itself be
running inside the event loop (a sync ``@cl.step`` invoked from an async
handler, for example). Driving a coroutine from there means re-entering the
loop, which asyncio forbids: ``run_until_complete`` refuses while the loop is
running, and the C task registry refuses to enter a task while another one is
current.

The technique below is nest_asyncio's (https://github.com/erdewit/nest_asyncio),
reduced to what ``run_sync()`` actually needs. nest_asyncio suspends the
current task around *every individual callback*, which forces it to
reimplement ``_run_once``, ``run_forever`` and the loop's running-state
bookkeeping, and to install all of that onto ``loop.__class__``. Suspending
the outer task around *one nested run* instead needs none of that: the stdlib
scheduler is called as-is, and no asyncio global or class is rebound. In
particular ``asyncio.Task`` and ``asyncio.Future`` keep their C
implementations, which is the rebind that broke nest_asyncio on 3.14.

Calling the stdlib ``_run_once`` as-is does have one consequence to repay. It
snapshots ``ntodo = len(self._ready)`` and then pops exactly that many
handles, so a nested run started from inside one of those callbacks drains
entries the enclosing iteration is still counting on and its next ``popleft()``
raises ``IndexError: pop from an empty deque``. nest_asyncio avoids this by
guarding its own reimplemented ``_run_once`` with ``if not ready: break`` --
which only works because it patches the enclosing loop too. Since nothing here
is patched, the nested run instead appends one cancelled handle per entry it
borrowed; ``_run_once`` pops those and skips them. The queue is padded rather
than swapped out so the borrowed callbacks still run during the nested run:
withholding them deadlocks any nested coroutine waiting on work they complete.

Private APIs relied on
----------------------
- ``loop._run_once()`` — one iteration of the stdlib scheduler.
- ``loop._stopping`` — set when something calls ``loop.stop()`` during the
  nested run; the run must then yield control rather than spin.
- ``loop._ready`` — the scheduler's ready queue, padded as described above.
- ``_asyncio._swap_current_task(loop, task)`` (Python 3.12+) — sets the loop's
  current task and returns the previous one.
- ``asyncio.tasks._current_tasks`` (Python 3.10-3.11, where
  ``_swap_current_task`` does not exist) — the mapping the C accelerator reads
  current-task state from on those versions.

The version split is not cosmetic: Python 3.14 moved current-task tracking off
``_current_tasks`` and into the thread state, so mutating that dict there is a
silent no-op and the task never actually gets suspended.
``test_reentrant_loop.py`` asserts each of these attributes exists on the
running interpreter, so a future Python removing one fails loudly instead.
"""

import asyncio
import sys
from typing import Any, Callable, Coroutine, Optional, TypeVar

T_Retval = TypeVar("T_Retval")

_SuspendCurrentTask = Callable[[asyncio.AbstractEventLoop], Optional[asyncio.Task]]
_ResumeCurrentTask = Callable[[asyncio.AbstractEventLoop, Optional[asyncio.Task]], None]


def _make_suspension_pair() -> tuple[_SuspendCurrentTask, _ResumeCurrentTask]:
    """Pick how to suspend and restore the loop's current task on this Python."""
    if sys.version_info >= (3, 12):
        from _asyncio import _swap_current_task

        def suspend(loop: asyncio.AbstractEventLoop) -> Optional[asyncio.Task]:
            return _swap_current_task(loop, None)

        def resume(
            loop: asyncio.AbstractEventLoop, task: Optional[asyncio.Task]
        ) -> None:
            _swap_current_task(loop, task)

        return suspend, resume

    current_tasks = asyncio.tasks._current_tasks  # type: ignore[attr-defined]

    def suspend_legacy(loop: asyncio.AbstractEventLoop) -> Optional[asyncio.Task]:
        return current_tasks.pop(loop, None)

    def resume_legacy(
        loop: asyncio.AbstractEventLoop, task: Optional[asyncio.Task]
    ) -> None:
        if task is None:
            current_tasks.pop(loop, None)
        else:
            current_tasks[loop] = task

    return suspend_legacy, resume_legacy


_suspend_current_task, _resume_current_task = _make_suspension_pair()


def _noop() -> None:
    """Body of the cancelled filler handles; never actually invoked."""


def run_coroutine_reentrant(
    loop: asyncio.AbstractEventLoop, coro: Coroutine[Any, Any, T_Retval]
) -> T_Retval:
    """Run ``coro`` to completion on ``loop`` from inside that same loop.

    The calling task is suspended for the duration, so the coroutine's own task
    can be entered; other pending callbacks keep being serviced meanwhile.
    """
    # An enclosing ``_run_once`` snapshots ``ntodo = len(self._ready)`` and then
    # pops exactly that many times. Anything already queued here is within that
    # count, and the nested run below will consume it, so the enclosing pops
    # must be given something to find or they raise ``IndexError: pop from an
    # empty deque``. Repay the number borrowed with cancelled handles, which
    # ``_run_once`` pops and skips. Padding rather than hiding the queue keeps
    # those callbacks running during the nested run: user code routinely waits
    # on work that a callback queued in this same iteration completes, and
    # withholding them deadlocks it.
    #
    # Measured before ``ensure_future`` below, whose ``call_soon`` of the nested
    # task's first step is appended after the enclosing snapshot was taken and
    # so is not owed back. This is an upper bound, not an exact count: handles
    # appended by earlier callbacks in the same iteration are also outside
    # ``ntodo``. Over-repaying is harmless -- the surplus is popped and skipped
    # on a later iteration -- whereas under-repaying raises.
    ready = loop._ready  # type: ignore[attr-defined]
    borrowed = len(ready)
    filler = asyncio.Handle(_noop, (), loop)
    filler.cancel()

    future = asyncio.ensure_future(coro, loop=loop)
    # The RuntimeError below is a better diagnostic than the "Future exception
    # was never retrieved" warning that would otherwise fire at collection.
    future._log_destroy_pending = False  # type: ignore[attr-defined]

    outer_task = _suspend_current_task(loop)
    try:
        while not future.done():
            loop._run_once()  # type: ignore[attr-defined]
            if loop._stopping:  # type: ignore[attr-defined]
                break
    finally:
        _resume_current_task(loop, outer_task)
        ready.extend([filler] * borrowed)

    if not future.done():
        future.cancel()
        raise RuntimeError(
            "The event loop was stopped before cl.run_sync() finished running "
            "the coroutine."
        )

    return future.result()
