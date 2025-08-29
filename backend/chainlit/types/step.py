
import asyncio
import inspect
import json
import uuid
from copy import deepcopy
from functools import wraps
from typing import Callable, Dict, List, Optional, TypedDict, Union, Literal

from sqlmodel import SQLModel, Field

# If you want to keep compatibility with literalai types, import as needed
from literalai import BaseGeneration
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from chainlit.config import config
from chainlit.context import CL_RUN_NAMES, context, local_steps
from chainlit.data import get_data_layer
from chainlit.element import Element
from chainlit.logger import logger
from chainlit.types import FeedbackDict
from chainlit.utils import utc_now

TrueStepType = Literal[
    "run", "tool", "llm", "embedding", "retrieval", "rerank", "undefined"
]

MessageStepType = Literal["user_message", "assistant_message", "system_message"]

StepType = Union[TrueStepType, MessageStepType]

class Step(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = ""
    type: str = "undefined"
    parent_id: Optional[str] = Field(default=None, foreign_key="step.id")
    thread_id: Optional[str] = None
    streaming: bool = False
    persisted: bool = False
    show_input: Union[bool, str] = "json"
    is_error: Optional[bool] = False
    metadata: Dict = Field(default_factory=dict)
    tags: Optional[List[str]] = None
    created_at: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    generation: Optional[BaseGeneration] = None
    language: Optional[str] = None
    default_open: Optional[bool] = False
    input: Optional[str] = ""
    output: Optional[str] = ""

    # TODO define relationship with Element
    # elements: List[Element] = Relationship(back_populates="step")
    # thread: Optional[Thread] = Relationship(back_populates="steps")

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

def flatten_args_kwargs(func, args, kwargs):
    signature = inspect.signature(func)
    bound_arguments = signature.bind(*args, **kwargs)
    bound_arguments.apply_defaults()
    return {k: deepcopy(v) for k, v in bound_arguments.arguments.items()}

def check_add_step_in_cot(step: "Step"):
    is_message = step.type in [
        "user_message",
        "assistant_message",
    ]
    is_cl_run = step.name in CL_RUN_NAMES and step.type == "run"
    if config.ui.cot == "hidden" and not is_message and not is_cl_run:
        return False
    return True

# Step decorator for async and sync functions, now using StepService
def step(
        original_function: Optional[Callable] = None,
        *,
        name: Optional[str] = "",
        type: Optional[str] = "undefined",
        id: Optional[str] = None,
        parent_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict] = None,
        language: Optional[str] = None,
        show_input: Union[bool, str] = "json",
        default_open: bool = False
    ) -> Callable:
    def wrapper(func: Callable):
        nonlocal name
        if not name:
            name = func.__name__
        if inspect.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                async with StepService(
                    type=type,
                    name=name,
                    id=id,
                    parent_id=parent_id,
                    tags=tags,
                    language=language,
                    show_input=show_input,
                    default_open=default_open,
                    metadata=metadata,
                ) as step:
                    try:
                        step.input = flatten_args_kwargs(func, args, kwargs)
                    except Exception:
                        pass
                    result = await func(*args, **kwargs)
                    try:
                        if result and not step.output:
                            step.output = result
                    except Exception:
                        step.is_error = True
                        step.output = str(result)
                    return result
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                with StepService(
                    type=type,
                    name=name,
                    id=id,
                    parent_id=parent_id,
                    tags=tags,
                    language=language,
                    show_input=show_input,
                    default_open=default_open,
                    metadata=metadata,
                ) as step:
                    try:
                        step.input = flatten_args_kwargs(func, args, kwargs)
                    except Exception:
                        pass
                    result = func(*args, **kwargs)
                    try:
                        if result and not step.output:
                            step.output = result
                    except Exception:
                        step.is_error = True
                        step.output = str(result)
                    return result
            return sync_wrapper
    func = original_function
    if not func:
        return wrapper
    else:
        return wrapper(func)


# StepService: business logic, context managers, and decorator support
class StepService:
    def __init__(self, **kwargs):
        self.step = Step(**kwargs)
        self.elements = []
        self.fail_on_persist_error = False
        self._input = ""
        self._output = ""

    @property
    def input(self):
        return self._input

    @input.setter
    def input(self, content: Union[Dict, str]):
        self._input = self._process_content(content, set_language=False)
        self.step.input = self._input

    @property
    def output(self):
        return self._output

    @output.setter
    def output(self, content: Union[Dict, str]):
        self._output = self._process_content(content, set_language=True)
        self.step.output = self._output

    def _clean_content(self, content):
        def handle_bytes(item):
            if isinstance(item, bytes):
                return "STRIPPED_BINARY_DATA"
            elif isinstance(item, dict):
                return {k: handle_bytes(v) for k, v in item.items()}
            elif isinstance(item, list):
                return [handle_bytes(i) for i in item]
            elif isinstance(item, tuple):
                return tuple(handle_bytes(i) for i in item)
            return item
        return handle_bytes(content)

    def _process_content(self, content, set_language=False):
        if content is None:
            return ""
        content = self._clean_content(content)
        if isinstance(content, (dict, list, tuple)):
            try:
                processed_content = json.dumps(content, indent=4, ensure_ascii=False)
                if set_language:
                    self.step.language = "json"
            except TypeError:
                processed_content = str(content).replace("\\n", "\n")
                if set_language:
                    self.step.language = "text"
        elif isinstance(content, str):
            processed_content = content
        else:
            processed_content = str(content).replace("\\n", "\n")
            if set_language:
                self.step.language = "text"
        return processed_content

    def to_dict(self):
        return self.step.dict()

    # Context manager support
    async def __aenter__(self):
        self.start = utc_now()
        previous_steps = local_steps.get() or []
        parent_step = previous_steps[-1] if previous_steps else None

        if not self.parent_id:
            if parent_step:
                self.parent_id = parent_step.id
        local_steps.set(previous_steps + [self])
        await self.send()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.end = utc_now()

        if exc_type:
            self.output = str(exc_val)
            self.is_error = True

        current_steps = local_steps.get()
        if current_steps and self in current_steps:
            current_steps.remove(self)
            local_steps.set(current_steps)

        await self.update()

    def __enter__(self):
        self.start = utc_now()

        previous_steps = local_steps.get() or []
        parent_step = previous_steps[-1] if previous_steps else None

        if not self.parent_id:
            if parent_step:
                self.parent_id = parent_step.id
        local_steps.set(previous_steps + [self])

        asyncio.create_task(self.send())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = utc_now()

        if exc_type:
            self.output = str(exc_val)
            self.is_error = True

        current_steps = local_steps.get()
        if current_steps and self in current_steps:
            current_steps.remove(self)
            local_steps.set(current_steps)

        asyncio.create_task(self.update())

    # Business logic methods restored from original Step class

    async def update(self):
        """
        Update a step already sent to the UI.
        """
        if self.step.streaming:
            self.step.streaming = False

        step_dict = self.step.model_dump(by_alias=True)
        data_layer = get_data_layer()

        if data_layer:
            try:
                asyncio.create_task(data_layer.update_step(step_dict.copy()))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step update: {e!s}")

        # elements logic
        tasks = [el.send(for_id=self.step.id) for el in getattr(self, 'elements', [])]
        await asyncio.gather(*tasks)

        # UI update logic
        from chainlit.context import check_add_step_in_cot, stub_step
        if not check_add_step_in_cot(self.step):
            await context.emitter.update_step(stub_step(self.step))
        else:
            await context.emitter.update_step(step_dict)

        return True


    async def remove(self):
        """
        Remove a step already sent to the UI.
        """
        step_dict = self.to_dict()
        from chainlit.data import get_data_layer
        from chainlit.logger import logger
        from chainlit.context import context
        data_layer = get_data_layer()

        if data_layer:
            try:
                asyncio.create_task(data_layer.delete_step(self.step.id))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step deletion: {e!s}")

        await context.emitter.delete_step(step_dict)
        return True


    async def send(self):
        from chainlit.config import config
        from chainlit.data import get_data_layer
        from chainlit.logger import logger
        from chainlit.context import context, check_add_step_in_cot, stub_step
        if self.step.persisted:
            return self

        if getattr(config.code, "author_rename", None):
            self.step.name = await config.code.author_rename(self.step.name)

        if self.step.streaming:
            self.step.streaming = False

        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer:
            try:
                asyncio.create_task(data_layer.create_step(step_dict.copy()))
                self.step.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step creation: {e!s}")

        tasks = [el.send(for_id=self.step.id) for el in getattr(self, 'elements', [])]
        await asyncio.gather(*tasks)

        if not check_add_step_in_cot(self.step):
            await context.emitter.send_step(stub_step(self.step))
        else:
            await context.emitter.send_step(step_dict)

        return self


    async def stream_token(self, token: str, is_sequence=False, is_input=False):
        """
        Sends a token to the UI.
        Once all tokens have been streamed, call .send() to end the stream and persist the step if persistence is enabled.
        """
        from chainlit.context import context, check_add_step_in_cot, stub_step
        if not token:
            return

        if is_sequence:
            if is_input:
                self.input = token
            else:
                self.output = token
        else:
            if is_input:
                self.input += token
            else:
                self.output += token

        assert self.step.id

        if not check_add_step_in_cot(self.step):
            await context.emitter.send_step(stub_step(self.step))
            return

        if not self.step.streaming:
            self.step.streaming = True
            step_dict = self.to_dict()
            await context.emitter.stream_start(step_dict)
        else:
            await context.emitter.send_token(
                id=self.step.id, token=token, is_sequence=is_sequence, is_input=is_input
            )
