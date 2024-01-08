import asyncio
import inspect
import json
import time
import uuid
from datetime import datetime
from functools import wraps
from typing import Callable, Dict, List, Optional, TypedDict, Union

from chainlit.config import config
from chainlit.context import context
from chainlit.data import get_data_layer
from chainlit.element import Element
from chainlit.logger import logger
from chainlit.telemetry import trace_event
from chainlit.types import FeedbackDict
from literalai import BaseGeneration
from literalai.step import StepType, TrueStepType


class StepDict(TypedDict, total=False):
    name: str
    type: StepType
    id: str
    threadId: str
    parentId: Optional[str]
    disableFeedback: bool
    streaming: bool
    waitForAnswer: Optional[bool]
    isError: Optional[bool]
    metadata: Dict
    input: str
    output: str
    createdAt: Optional[str]
    start: Optional[str]
    end: Optional[str]
    generation: Optional[Dict]
    showInput: Optional[Union[bool, str]]
    language: Optional[str]
    indent: Optional[int]
    feedback: Optional[FeedbackDict]


def step(
    original_function: Optional[Callable] = None,
    *,
    name: Optional[str] = "",
    type: TrueStepType = "undefined",
    id: Optional[str] = None,
    disable_feedback: bool = True,
    root: bool = False,
    language: Optional[str] = None,
    show_input: Union[bool, str] = False,
):
    """Step decorator for async and sync functions."""

    def wrapper(func: Callable):
        nonlocal name
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
                    disable_feedback=disable_feedback,
                    root=root,
                    language=language,
                    show_input=show_input,
                ) as step:
                    try:
                        step.input = {"args": args, "kwargs": kwargs}
                    except:
                        pass
                    result = await func(*args, **kwargs)
                    try:
                        if result and not step.output:
                            step.output = result
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
                    disable_feedback=disable_feedback,
                    root=root,
                    language=language,
                    show_input=show_input,
                ) as step:
                    try:
                        step.input = {"args": args, "kwargs": kwargs}
                    except:
                        pass
                    result = func(*args, **kwargs)
                    try:
                        if result and not step.output:
                            step.output = result
                    except:
                        pass
                    return result

            return sync_wrapper

    func = original_function
    if not func:
        return wrapper
    else:
        return wrapper(func)


class Step:
    # Constructor
    name: str
    type: TrueStepType
    id: str
    parent_id: Optional[str]
    disable_feedback: bool

    streaming: bool
    persisted: bool

    root: bool
    show_input: Union[bool, str]

    is_error: Optional[bool]
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
        name: Optional[str] = config.ui.name,
        type: TrueStepType = "undefined",
        id: Optional[str] = None,
        parent_id: Optional[str] = None,
        elements: Optional[List[Element]] = None,
        disable_feedback: bool = True,
        root: bool = False,
        language: Optional[str] = None,
        show_input: Union[bool, str] = False,
    ):
        trace_event(f"init {self.__class__.__name__} {type}")
        time.sleep(0.001)
        self._input = ""
        self._output = ""
        self.thread_id = context.session.thread_id
        self.name = name or ""
        self.type = type
        self.id = id or str(uuid.uuid4())
        self.disable_feedback = disable_feedback
        self.metadata = {}
        self.is_error = False
        self.show_input = show_input
        self.parent_id = parent_id
        self.root = root

        self.language = language
        self.generation = None
        self.elements = elements or []

        self.created_at = datetime.utcnow().isoformat()
        self.start = None
        self.end = None

        self.streaming = False
        self.persisted = False
        self.fail_on_persist_error = False

    def _process_content(self, content, set_language=False):
        if content is None:
            return ""
        if isinstance(content, dict):
            try:
                processed_content = json.dumps(content, indent=4, ensure_ascii=False)
                if set_language:
                    self.language = "json"
            except TypeError:
                processed_content = str(content)
                if set_language:
                    self.language = "text"
        elif isinstance(content, str):
            processed_content = content
        else:
            processed_content = str(content)
            if set_language:
                self.language = "text"
        return processed_content

    @property
    def input(self):
        return self._input

    @input.setter
    def input(self, content: Union[Dict, str]):
        self._input = self._process_content(content, set_language=False)

    @property
    def output(self):
        return self._output

    @output.setter
    def output(self, content: Union[Dict, str]):
        self._output = self._process_content(content, set_language=True)

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
            "isError": self.is_error,
            "output": self.output,
            "createdAt": self.created_at,
            "start": self.start,
            "end": self.end,
            "language": self.language,
            "showInput": self.show_input,
            "generation": self.generation.to_dict() if self.generation else None,
        }
        return _dict

    async def update(self):
        """
        Update a step already sent to the UI.
        """
        trace_event("update_step")

        if self.streaming:
            self.streaming = False

        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer:
            try:
                asyncio.create_task(data_layer.update_step(step_dict.copy()))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step update: {str(e)}")

        tasks = [el.send(for_id=self.id) for el in self.elements]
        await asyncio.gather(*tasks)

        if config.ui.hide_cot and self.parent_id:
            return

        if not config.features.prompt_playground and "generation" in step_dict:
            step_dict.pop("generation", None)

        await context.emitter.update_step(step_dict)

        return True

    async def remove(self):
        """
        Remove a step already sent to the UI.
        """
        trace_event("remove_step")

        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer:
            try:
                asyncio.create_task(data_layer.delete_step(self.id))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step deletion: {str(e)}")

        await context.emitter.delete_step(step_dict)

        return True

    async def send(self):
        if self.persisted:
            return

        if config.code.author_rename:
            self.name = await config.code.author_rename(self.name)

        if self.streaming:
            self.streaming = False

        step_dict = self.to_dict()

        data_layer = get_data_layer()

        if data_layer:
            try:
                asyncio.create_task(data_layer.create_step(step_dict.copy()))
                self.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step creation: {str(e)}")

        tasks = [el.send(for_id=self.id) for el in self.elements]
        await asyncio.gather(*tasks)

        if config.ui.hide_cot and self.parent_id:
            return self.id

        if not config.features.prompt_playground and "generation" in step_dict:
            step_dict.pop("generation", None)

        await context.emitter.send_step(step_dict)

        return self.id

    async def stream_token(self, token: str, is_sequence=False):
        """
        Sends a token to the UI.
        Once all tokens have been streamed, call .send() to end the stream and persist the step if persistence is enabled.
        """

        if not self.streaming:
            self.streaming = True
            step_dict = self.to_dict()
            await context.emitter.stream_start(step_dict)

        if is_sequence:
            self.output = token
        else:
            self.output += token

        assert self.id

        if config.ui.hide_cot and self.parent_id:
            return

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
        self.start = datetime.utcnow().isoformat()
        if not self.parent_id and not self.root:
            if current_step := context.current_step:
                self.parent_id = current_step.id
            elif context.session.root_message:
                self.parent_id = context.session.root_message.id
        context.session.active_steps.append(self)
        await self.send()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.end = datetime.utcnow().isoformat()

        if self in context.session.active_steps:
            context.session.active_steps.remove(self)
        await self.update()

    def __enter__(self):
        self.start = datetime.utcnow().isoformat()
        if not self.parent_id and not self.root:
            if current_step := context.current_step:
                self.parent_id = current_step.id
            elif context.session.root_message:
                self.parent_id = context.session.root_message.id
        context.session.active_steps.append(self)

        asyncio.create_task(self.send())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = datetime.utcnow().isoformat()
        if self in context.session.active_steps:
            context.session.active_steps.remove(self)
        asyncio.create_task(self.update())
