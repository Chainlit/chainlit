import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, TypedDict, Union

from chainlit.config import config
from chainlit.context import context
from chainlit.data import get_persister
from chainlit.element import Element
from chainlit.logger import logger
from chainlit.telemetry import trace_event
from chainlit_client import BaseGeneration, StepType


class StepDict(TypedDict):
    name: str
    type: StepType
    id: str
    threadId: str
    parentId: Optional[str]
    disableHumanFeedback: bool
    streaming: bool
    input: Optional[Union[str, Dict]]
    output: Optional[Union[str, Dict]]
    createdAt: Union[str, None]
    start: Union[str, None]
    end: Union[str, None]
    generation: Optional[Dict]
    language: Optional[str]


class Step:
    # Constructor
    name: str
    type: StepType
    id: str
    parent_id: Optional[str]
    disable_human_feedback: bool

    streaming: bool
    persisted: bool

    thread_id: str
    input: Optional[Union[str, Dict]]
    output: Optional[Union[str, Dict]]
    created_at: Union[str, None]
    start: Union[str, None]
    end: Union[str, None]
    generation: Optional[BaseGeneration]
    language: Optional[str]
    elements: Optional[List[Element]]
    fail_on_persist_error: bool

    def __init__(
        self,
        name: str,
        type: str,
        id: Optional[str] = None,
        parent_id: Optional[str] = None,
        disable_human_feedback: bool = True,
    ):
        trace_event(f"init {self.__class__.__name__} {type}")
        self.thread_id = context.session.thread_id
        self.name = name
        self.type = type
        self.id = id or str(uuid.uuid4())
        self.parent_id = parent_id
        self.disable_human_feedback = disable_human_feedback

        self.created_at = datetime.now(timezone.utc).isoformat()
        self.start = self.created_at

        self.streaming = False
        self.persisted = False
        self.fail_on_persist_error = False

    def to_dict(self) -> StepDict:
        _dict: StepDict = {
            "name": self.name,
            "type": self.type,
            "id": self.id,
            "threadId": self.thread_id,
            "parentId": self.parent_id,
            "disableHumanFeedback": self.disable_human_feedback,
            "streaming": self.streaming,
            "input": self.input,
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

        if persister := get_persister() and not self.persisted:
            try:
                # asyncio.create_task(persister(msg_dict))
                self.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step update: {str(e)}")

        await context.emitter.update_message(step_dict)

        return True

    async def remove(self):
        """
        Remove a step already sent to the UI.
        """
        trace_event("remove_step")

        step_dict = self.to_dict()

        if persister := get_persister() and not self.persisted:
            try:
                # asyncio.create_task(persister(msg_dict))
                self.persisted = True
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

        if persister := get_persister() and not self.persisted:
            try:
                # asyncio.create_task(persister(msg_dict))
                self.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist step creation: {str(e)}")

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
            self.content = token
        else:
            self.content += token

        assert self.id
        await context.emitter.send_token(
            id=self.id, token=token, is_sequence=is_sequence
        )
