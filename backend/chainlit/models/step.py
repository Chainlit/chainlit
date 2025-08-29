
import asyncio
import inspect
import json
import uuid
from copy import deepcopy
from functools import wraps
from typing import Callable, Dict, List, Optional, TypedDict, Union, Literal, Any, get_args

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import PrivateAttr
from pydantic import field_validator
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
from chainlit.context import context

TrueStepType = Literal[
    "run", "tool", "llm", "embedding", "retrieval", "rerank", "undefined"
]

MessageStepType = Literal["user_message", "assistant_message", "system_message"]

StepType = Union[TrueStepType, MessageStepType]

class Step(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(..., nullable=False)
    type: str = Field(..., nullable=False)
    thread_id: str = Field(..., foreign_key="thread.id", nullable=False)
    parent_id: Optional[str] = Field(default=None, foreign_key="step.id")
    disable_feedback: bool = Field(default=False, nullable=False)
    streaming: bool = Field(default=False, nullable=False)
    wait_for_answer: Optional[bool] = Field(default=None)
    is_error: Optional[bool] = Field(default=None)
    metadata_: Optional[dict] = Field(default_factory=dict, sa_column=Column('metadata', JSON), alias='metadata', schema_extra={'serialization_alias': 'metadata'})
    input: Optional[str] = Field(default=None)
    output: Optional[str] = Field(default=None)
    created_at: Optional[str] = Field(default=None)
    start: Optional[str] = Field(default=None)
    end: Optional[str] = Field(default=None)
    generation: Optional[dict] = Field(default_factory=dict, sa_column=Column('generation', JSON), alias='generation')
    show_input: str = Field(default="json")
    language: Optional[str] = Field(default=None)
    indent: Optional[int] = Field(default=None)
    tags: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSON))
    default_open: Optional[bool] = Field(default=False)
    
    model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)
    
    # TODO define relationship with Element
    # elements: List[Element] = Relationship(back_populates="step")
    # thread: Optional[Thread] = Relationship(back_populates="steps")

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    # Private attributes for business logic (not persisted or serialized)
    _elements: Optional[List[Element]] = PrivateAttr(default_factory=list)
    _fail_on_persist_error: bool = PrivateAttr(default=False)
    _input: str = PrivateAttr(default="")
    _output: str = PrivateAttr(default="")

    @field_validator("type", mode="before")
    def validate_type(cls, v):
        allowed = [v for arg in get_args(StepType) for v in (get_args(arg) if hasattr(arg, "__args__") else [arg])]
        if v not in allowed:
            raise ValueError(f"Invalid type: {v}. Must be one of: {allowed}")
        return v

    @property
    def input_value(self):
        return self._input

    @input_value.setter
    def input_value(self, content: Union[Dict, str]):
        self._input = self._process_content(content, set_language=False)
        self.input = self._input

    @property
    def output_value(self):
        return self._output

    @output_value.setter
    def output_value(self, content: Union[Dict, str]):
        self._output = self._process_content(content, set_language=True)
        self.output = self._output

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
                    self.language = "json"
            except TypeError:
                processed_content = str(content).replace("\\n", "\n")
                if set_language:
                    self.language = "text"
        elif isinstance(content, str):
            processed_content = content
        else:
            processed_content = str(content).replace("\\n", "\n")
            if set_language:
                self.language = "text"
        return processed_content

    def to_dict(self):
        return self.model_dump(by_alias=True)

    # Context manager support
    async def __aenter__(self):
        self.start = utc_now()
        previous_steps = local_steps.get() or []
        parent_step = previous_steps[-1] if previous_steps else None

        if not self.parent_id and parent_step:
            self.parent_id = parent_step.id
        local_steps.set(previous_steps + [self])
        await self.send()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.end = utc_now()

        if exc_type:
            self.output_value = str(exc_val)
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

        task = asyncio.create_task(self.send())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = utc_now()

        if exc_type:
            self.output_value = str(exc_val)
            self.is_error = True

        current_steps = local_steps.get()
        if current_steps and self in current_steps:
            current_steps.remove(self)
            local_steps.set(current_steps)

        task = asyncio.create_task(self.update())

    async def update(self):
        if self.streaming:
            self.streaming = False

        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer:
            try:
                task = asyncio.create_task(data_layer.update_step(step_dict.copy()))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step update: {e!s}")

        tasks = [el.send(for_id=self.id) for el in getattr(self, 'elements', [])]
        await asyncio.gather(*tasks)

        from chainlit.context import check_add_step_in_cot, stub_step
        if not check_add_step_in_cot(self):
            await context.emitter.update_step(stub_step(self))
        else:
            await context.emitter.update_step(step_dict)

        return True

    async def remove(self):
        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer:
            try:
                task = asyncio.create_task(data_layer.delete_step(self.id))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step deletion: {e!s}")

        await context.emitter.delete_step(step_dict)
        return True

    async def send(self):
        if self.persisted:
            return self

        if getattr(config.code, "author_rename", None):
            self.name = await config.code.author_rename(self.name)

        if self.streaming:
            self.streaming = False

        step_dict = self.to_dict()
        data_layer = get_data_layer()

        if data_layer:
            try:
                task = asyncio.create_task(data_layer.create_step(step_dict.copy()))
                self.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step creation: {e!s}")

        tasks = [el.send(for_id=self.id) for el in getattr(self, 'elements', [])]
        await asyncio.gather(*tasks)

        if not check_add_step_in_cot(self):
            await context.emitter.send_step(self.to_dict())
        else:
            await context.emitter.send_step(step_dict)

        return self

    async def stream_token(self, token: str, is_sequence=False, is_input=False):
        if not token:
            return

        if is_sequence:
            if is_input:
                self.input_value = token
            else:
                self.output_value = token
        else:
            if is_input:
                self.input_value += token
            else:
                self.output_value += token

        assert self.id

        if not check_add_step_in_cot(self):
            await context.emitter.send_step(stub_step(self))
            return

        if not self.streaming:
            self.streaming = True
            step_dict = self.to_dict()
            await context.emitter.stream_start(step_dict)
        else:
            await context.emitter.send_token(
                id=self.id, token=token, is_sequence=is_sequence, is_input=is_input
            )

def flatten_args_kwargs(func, args, kwargs):
    signature = inspect.signature(func)
    bound_arguments = signature.bind(*args, **kwargs)
    bound_arguments.apply_defaults()
    return {k: deepcopy(v) for k, v in bound_arguments.arguments.items()}

def check_add_step_in_cot(step: Step):
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
                async with Step(
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
                with Step(
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
