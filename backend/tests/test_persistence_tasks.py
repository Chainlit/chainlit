"""Persistence tasks must be strongly referenced until they complete.

Every data-layer write in chainlit is fire-and-forget: the coroutine is handed
to ``asyncio.create_task`` and never awaited. The event loop only keeps a weak
reference to a task, so a task whose sole reference was the ``create_task()``
call expression may be garbage collected before it reaches the data layer --
silently, with no exception and nothing in the logs.

What these tests check is the invariant that rules that out: while a write is in
flight the spawning module holds the task in its ``_persistence_tasks`` set, and
the task is dropped from that set once it is done.

What they deliberately do not do is force a collection and assert the task
survived. That test would not work: a suspended task is reachable from whatever
it is awaiting (an Event's waiter deque, a timer handle on the loop), so it
survives ``gc.collect()`` with or without the fix, and the test would pass just
as happily against the unfixed code. Asserting the strong reference exists is
the property that can actually be pinned down deterministically.

Assertions are made against the *delta* of each module's task set rather than
its absolute contents, so that tests elsewhere in the suite that patch
``asyncio.create_task`` with a Mock -- which lands in the set and is never
discarded, because the mock's ``add_done_callback`` does nothing -- cannot
affect the result either way.
"""

import asyncio
import importlib
from contextlib import contextmanager
from typing import Optional
from unittest.mock import AsyncMock, Mock, patch

import pytest

from chainlit.context import ChainlitContext, context_var
from chainlit.element import Text
from chainlit.message import Message
from chainlit.step import Step
from chainlit.user import PersistedUser

# The chainlit package re-exports `step` as the decorator and `context` as a
# lazy proxy for the active context, so `from chainlit import step` does not
# give you the module. Reach the real modules explicitly.
context_module = importlib.import_module("chainlit.context")
element_module = importlib.import_module("chainlit.element")
message_module = importlib.import_module("chainlit.message")
step_module = importlib.import_module("chainlit.step")


class TaskWatch:
    """Watches one module's persistence-task set for tasks this test spawned."""

    def __init__(self, module):
        self.module = module
        self._baseline = set(module._persistence_tasks)

    @property
    def new(self) -> set:
        return {
            task
            for task in self.module._persistence_tasks
            if task not in self._baseline
        }

    async def drain(self, timeout: float = 1.0):
        """Yield to the loop until every task this test spawned has finished.

        A write can spawn further writes (a step's ``send()`` sends its
        elements), so keep yielding until the delta is empty rather than
        draining once.
        """
        loop = asyncio.get_running_loop()
        deadline = loop.time() + timeout

        while loop.time() < deadline:
            if not self.new:
                return
            await asyncio.sleep(0)

        raise AssertionError(
            f"{self.module.__name__} persistence tasks did not drain: {self.new}"
        )


class Gate:
    """A data-layer call that blocks until the test lets it through.

    Holding the write open is what makes these tests deterministic: the task is
    guaranteed to still be in flight when we inspect the module's task set, and
    guaranteed to be done after we open the gate and yield to the loop.
    """

    def __init__(self):
        self.opened = asyncio.Event()
        self.entered = asyncio.Event()
        self.completed = False

    async def __call__(self, *args, **kwargs):
        self.entered.set()
        await self.opened.wait()
        self.completed = True


@contextmanager
def chainlit_context(session: Optional[Mock] = None):
    """Minimal Chainlit context, mirroring the helper in test_message.py."""
    mock_session = session or Mock()
    mock_session.thread_id = "thread_123"
    mock_session.persist_file = AsyncMock(return_value={"id": "file_123"})

    mock_context = ChainlitContext(session=mock_session, emitter=AsyncMock())
    token = context_var.set(mock_context)
    try:
        yield mock_context
    finally:
        context_var.reset(token)


@contextmanager
def gated_data_layer(module, method_name: str):
    """Patch ``module.get_data_layer`` so ``method_name`` blocks on a gate."""
    watch = TaskWatch(module)
    gate = Gate()
    data_layer = AsyncMock()
    setattr(data_layer, method_name, gate)

    with patch.object(module, "get_data_layer", return_value=data_layer):
        yield watch, gate

    assert not watch.new, "a completed persistence task was left in the set"


async def assert_held_then_released(watch: TaskWatch, gate: Gate, trigger):
    """The core invariant, exercised against one write site.

    While the write is in flight the module holds a strong reference to it; once
    the write completes the reference is dropped again.
    """
    await trigger()

    await asyncio.wait_for(gate.entered.wait(), timeout=1)

    in_flight = watch.new
    assert len(in_flight) == 1, "the in-flight write is not referenced by the module"
    (task,) = in_flight
    assert isinstance(task, asyncio.Task)
    assert not task.done()

    gate.opened.set()
    await watch.drain()

    assert gate.completed, "the data-layer write never ran"
    assert task.done()
    assert not task.cancelled()
    assert not watch.new, "the done callback should discard the task"


@pytest.mark.asyncio
class TestMessagePersistenceTasks:
    async def test_create_holds_the_task(self):
        with chainlit_context():
            with gated_data_layer(message_module, "create_step") as (watch, gate):
                msg = Message(content="hello")
                await assert_held_then_released(watch, gate, msg._create)

    async def test_update_holds_the_task(self):
        with chainlit_context():
            with gated_data_layer(message_module, "update_step") as (watch, gate):
                msg = Message(content="hello")
                with patch.object(message_module, "chat_context"):
                    await assert_held_then_released(watch, gate, msg.update)

    async def test_remove_holds_the_task(self):
        with chainlit_context():
            with gated_data_layer(message_module, "delete_step") as (watch, gate):
                msg = Message(content="hello", id="msg_123")
                with patch.object(message_module, "chat_context"):
                    await assert_held_then_released(watch, gate, msg.remove)


@pytest.mark.asyncio
class TestStepPersistenceTasks:
    async def test_send_holds_the_task(self):
        with chainlit_context():
            with gated_data_layer(step_module, "create_step") as (watch, gate):
                test_step = Step(name="test_step")
                await assert_held_then_released(watch, gate, test_step.send)

    async def test_update_holds_the_task(self):
        with chainlit_context():
            with gated_data_layer(step_module, "update_step") as (watch, gate):
                test_step = Step(name="test_step")
                await assert_held_then_released(watch, gate, test_step.update)

    async def test_remove_holds_the_task(self):
        with chainlit_context():
            with gated_data_layer(step_module, "delete_step") as (watch, gate):
                test_step = Step(name="test_step")
                await assert_held_then_released(watch, gate, test_step.remove)

    async def test_context_manager_holds_both_dispatch_tasks(self):
        """``__enter__``/``__exit__`` dispatch send() and update() the same way.

        These two are a step further from the data layer than the others -- the
        task wraps ``send()``/``update()`` rather than the data-layer call -- but
        they are discarded ``create_task`` results just the same, and losing one
        loses the whole step.
        """
        with chainlit_context():
            watch = TaskWatch(step_module)
            data_layer = AsyncMock()
            with patch.object(step_module, "get_data_layer", return_value=data_layer):
                with Step(name="cm_step"):
                    pass

                # Nothing has been awaited since __enter__, so neither dispatch
                # has had a chance to run yet -- but both must already be held.
                assert len(watch.new) == 2
                assert all(not task.done() for task in watch.new)

                await watch.drain()

                assert data_layer.create_step.await_count == 1
                assert data_layer.update_step.await_count == 1
                assert not watch.new


@pytest.mark.asyncio
class TestElementPersistenceTasks:
    async def test_create_holds_the_task(self):
        with chainlit_context():
            with gated_data_layer(element_module, "create_element") as (watch, gate):
                element = Text(name="doc.txt", content="body", url="http://x/doc.txt")
                await assert_held_then_released(watch, gate, element._create)


@pytest.mark.asyncio
class TestContextPersistenceTasks:
    async def test_init_http_context_holds_the_task(self):
        user = PersistedUser(
            id="user_123", createdAt="2026-01-01T00:00:00Z", identifier="tester"
        )

        watch = TaskWatch(context_module)
        gate = Gate()
        data_layer = AsyncMock()
        data_layer.update_thread = gate

        # init_http_context resolves the data layer through chainlit.data and
        # registers the resulting task on chainlit.context.
        with patch("chainlit.data.get_data_layer", return_value=data_layer):

            async def trigger():
                context_module.init_http_context(user=user)

            await assert_held_then_released(watch, gate, trigger)


@pytest.mark.asyncio
async def test_task_set_does_not_grow_without_bound():
    """The set is a live registry, not an accumulator.

    A module-level collection that only ever grows would be a memory leak for
    the lifetime of the process, so pin that completed writes are evicted.
    """
    with chainlit_context():
        watch = TaskWatch(message_module)
        data_layer = AsyncMock()
        with patch.object(message_module, "get_data_layer", return_value=data_layer):
            for _ in range(50):
                await Message(content="hello")._create()

            assert len(watch.new) == 50

            await watch.drain()

            assert data_layer.create_step.await_count == 50
            assert not watch.new
