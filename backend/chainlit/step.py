import uuid
import inspect
import json
import asyncio
from functools import wraps
from datetime import datetime, timezone
from typing import Dict, List, Optional, TypedDict, Union, Callable

from chainlit.config import config
from chainlit.context import context
from chainlit.data import get_data_layer
from chainlit.element import Element
from chainlit.logger import logger
from chainlit.telemetry import trace_event
from chainlit.types import FeedbackDict

from chainlit_client import BaseGeneration, StepType


class StepDict(TypedDict, total=False):
    name: str
    type: StepType
    id: str
    threadId: str
    parentId: Optional[str]
    error: Optional[str]
    disableFeedback: bool
    streaming: bool
    metadata: Dict
    input: Optional[Union[str, Dict]]
    output: Optional[Union[str, Dict]]
    createdAt: Union[str, None]
    start: Union[str, None]
    end: Union[str, None]
    generation: Optional[Dict]
    language: Optional[str]
    feedback: Optional[FeedbackDict]


def step(
    original_function: Optional[Callable] = None,
    *,
    name: Optional[str] = "",
    type: StepType = "UNDEFINED",
    id: Optional[str] = None,
    parent_id: Optional[str] = None,
    thread_id: Optional[str] = None,
    disable_feedback: bool = True,
):
    """Step decorator for async and sync functions."""
    if not original_function:
        return Step(name, type, id, parent_id, disable_feedback)

    func = original_function

    if not name:
        name = func.__name__

    # Handle async decorator
    if inspect.iscoroutinefunction(func):

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            async with Step(
                type=type,
                name=name,
                id=id,
                parent_id=parent_id,
                thread_id=thread_id,
                disable_feedback=disable_feedback,
            ) as step:
                try:
                    step.input = json.dumps({"args": args, "kwargs": kwargs})
                except:
                    pass
                result = await func(*args, **kwargs)
                try:
                    if step.output is None:
                        step.output = json.dumps(result)
                except:
                    pass
                return result

        return async_wrapper
    else:
        # Handle sync decorator
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            with Step(
                type=type,
                name=name,
                id=id,
                parent_id=parent_id,
                thread_id=thread_id,
                disable_feedback=disable_feedback,
            ) as step:
                try:
                    step.input = json.dumps({"args": args, "kwargs": kwargs})
                except:
                    pass
                result = func(*args, **kwargs)
                try:
                    if step.output is None:
                        step.output = json.dumps(result)
                except:
                    pass
                return result

        return sync_wrapper


class Step:
    # Constructor
    name: str
    type: StepType
    id: str
    parent_id: Optional[str]
    disable_feedback: bool

    streaming: bool
    persisted: bool

    error: Optional[str]
    metadata: Dict
    thread_id: str
    created_at: Union[str, None]
    start: Union[str, None]
    end: Union[str, None]
    generation: Optional[BaseGeneration]
    language: Optional[str]
    elements: Optional[List[Element]]
    fail_on_persist_error: bool

    def __init__(
        self,
        name: Optional[str] = None,
        type: StepType = "UNDEFINED",
        id: Optional[str] = None,
        parent_id: Optional[str] = None,
        disable_feedback: bool = True,
    ):
        trace_event(f"init {self.__class__.__name__} {type}")
        self._input = None
        self._output = None
        self.thread_id = context.session.thread_id
        self.name = name or ""
        self.type = type
        self.id = id or str(uuid.uuid4())
        self.parent_id = parent_id
        self.disable_feedback = disable_feedback
        self.metadata = {}

        self.created_at = datetime.now(timezone.utc).isoformat()

        self.streaming = False
        self.persisted = False
        self.fail_on_persist_error = False

    def _process_content(self, content):
        if isinstance(content, dict):
            try:
                processed_content = json.dumps(content, indent=4, ensure_ascii=False)
                self.language = "json"
            except TypeError:
                processed_content = str(content)
                self.language = "text"
        elif isinstance(content, str):
            processed_content = content
        else:
            processed_content = str(content)
            self.language = "text"
        return processed_content

    @property
    def input(self):
        return self._input

    @input.setter
    def input(self, content: Union[Dict, str]):
        self._input = self._process_content(content)

    @property
    def output(self):
        return self._output

    @output.setter
    def output(self, content: Union[Dict, str]):
        self._output = self._process_content(content)

    def to_dict(self) -> StepDict:
        _dict: StepDict = {
            "name": self.name,
            "type": self.type,
            "id": self.id,
            "threadId": self.thread_id,
            "parentId": self.parent_id,
            "disableFeedback": self.disable_feedback,
            "streaming": self.streaming,
            "metadata": self.metadata,
            "input": self.input,
            "error": self.error,
            "output": self.output,
            "createdAt": self.created_at,
            "start": self.start,
            "end": self.end,
            "language": self.language,
            "generation": self.generation.to_dict() if self.generation else None,
        }

        return _dict

    async def update(
        self,
    ):
        """
        Update a step already sent to the UI.
        """
        trace_event("update_step")

        if self.streaming:
            self.streaming = False

        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer and not self.persisted:
            try:
                asyncio.create_task(data_layer.update_step(step_dict))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step update: {str(e)}")

        tasks = [el.send(for_id=self.id) for el in self.elements]
        await asyncio.gather(*tasks)

        await context.emitter.update_message(step_dict)

        return True

    async def remove(self):
        """
        Remove a step already sent to the UI.
        """
        trace_event("remove_step")

        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer and not self.persisted:
            try:
                asyncio.create_task(data_layer.delete_step(self.id))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step deletion: {str(e)}")

        await context.emitter.delete_message(step_dict)

        return True

    async def send(self):
        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        if self.streaming:
            self.streaming = False

        step_dict = self.to_dict()

        data_layer = get_data_layer()

        if data_layer and not self.persisted:
            try:
                asyncio.create_task(data_layer.create_step(step_dict))
                self.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step creation: {str(e)}")

        tasks = [el.send(for_id=self.id) for el in self.elements]
        await asyncio.gather(*tasks)

        await context.emitter.send_message(step_dict)

        return self.id

    async def stream_token(self, token: str, is_sequence=False):
        """
        Sends a token to the UI.
        Once all tokens have been streamed, call .send() to end the stream and persist the step if persistence is enabled.
        """

        if not self.streaming:
            self.streaming = True
            msg_dict = self.to_dict()
            await context.emitter.stream_start(msg_dict)

        if is_sequence:
            self.output = token
        else:
            self.output += token

        assert self.id
        await context.emitter.send_token(
            id=self.id, token=token, is_sequence=is_sequence
        )

    # Handle parameter less decorator
    def __call__(self, func):
        return step(
            original_function=func,
            type=self.type,
            name=self.name,
            id=self.id,
            parent_id=self.parent_id,
            thread_id=self.thread_id,
            disable_feedback=self.disable_feedback,
        )

    # Handle Context Manager Protocol
    async def __aenter__(self):
        self.start = datetime.now(timezone.utc).isoformat()
        active_steps = context.session.active_steps
        if not self.parent_id:
            if active_steps:
                parent_step = active_steps[-1]
                self.parent_id = parent_step.id
            else:
                self.parent_id = context.session.root_message.id
        active_steps.append(self)
        await self.send()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.end = datetime.now(timezone.utc).isoformat()
        context.session.active_steps.pop()
        await self.update()

    def __enter__(self):
        self.start = datetime.now(timezone.utc).isoformat()
        active_steps = context.session.active_steps
        if not self.parent_id:
            if active_steps:
                parent_step = active_steps[-1]
                self.parent_id = parent_step.id
            else:
                self.parent_id = context.session.root_message.id
        active_steps.append(self)
        asyncio.create_task(self.send())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = datetime.now(timezone.utc).isoformat()
        context.session.active_steps.pop()
        asyncio.create_task(self.update())