import asyncio
import json
import time
import uuid
from abc import ABC
from datetime import datetime
from typing import Dict, List, Optional, Union, cast

from chainlit.action import Action
from chainlit.config import config
from chainlit.context import context
from chainlit.data import get_data_layer
from chainlit.element import ElementBased
from chainlit.logger import logger
from chainlit.step import StepDict
from chainlit.telemetry import trace_event
from chainlit.types import (
    AskActionResponse,
    AskActionSpec,
    AskFileResponse,
    AskFileSpec,
    AskSpec,
    FileDict,
)
from literalai.step import MessageStepType


class MessageBase(ABC):
    id: str
    thread_id: str
    author: str
    content: str = ""
    type: MessageStepType = "assistant_message"
    disable_feedback = False
    streaming = False
    created_at: Union[str, None] = None
    fail_on_persist_error: bool = False
    persisted = False
    is_error = False
    language: Optional[str] = None
    wait_for_answer = False
    indent: Optional[int] = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")
        self.thread_id = context.session.thread_id

        if not getattr(self, "id", None):
            self.id = str(uuid.uuid4())

    @classmethod
    def from_dict(self, _dict: StepDict):
        type = _dict.get("type", "assistant_message")
        message = Message(
            id=_dict["id"],
            created_at=_dict["createdAt"],
            content=_dict["output"],
            author=_dict.get("name", config.ui.name),
            type=type,  # type: ignore
            disable_feedback=_dict.get("disableFeedback", False),
            language=_dict.get("language"),
        )

        return message

    def to_dict(self) -> StepDict:
        _dict: StepDict = {
            "id": self.id,
            "threadId": self.thread_id,
            "createdAt": self.created_at,
            "start": self.created_at,
            "end": self.created_at,
            "output": self.content,
            "name": self.author,
            "type": self.type,
            "createdAt": self.created_at,
            "language": self.language,
            "streaming": self.streaming,
            "disableFeedback": self.disable_feedback,
            "isError": self.is_error,
            "waitForAnswer": self.wait_for_answer,
            "indent": self.indent,
        }

        return _dict

    async def update(
        self,
    ):
        """
        Update a message already sent to the UI.
        """
        trace_event("update_message")

        if self.streaming:
            self.streaming = False

        step_dict = self.to_dict()

        data_layer = get_data_layer()
        if data_layer:
            try:
                asyncio.create_task(data_layer.update_step(step_dict))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist message update: {str(e)}")

        await context.emitter.update_step(step_dict)

        return True

    async def remove(self):
        """
        Remove a message already sent to the UI.
        """
        trace_event("remove_message")

        step_dict = self.to_dict()
        data_layer = get_data_layer()
        if data_layer:
            try:
                asyncio.create_task(data_layer.delete_step(step_dict["id"]))
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist message deletion: {str(e)}")

        await context.emitter.delete_step(step_dict)

        return True

    async def _create(self):
        step_dict = self.to_dict()
        data_layer = get_data_layer()
        if data_layer and not self.persisted:
            try:
                asyncio.create_task(data_layer.create_step(step_dict))
                self.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist message creation: {str(e)}")

        return step_dict

    async def send(self):
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        if self.content is None:
            self.content = ""

        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        if self.streaming:
            self.streaming = False

        step_dict = await self._create()
        await context.emitter.send_step(step_dict)

        return self.id

    async def stream_token(self, token: str, is_sequence=False):
        """
        Sends a token to the UI. This is useful for streaming messages.
        Once all tokens have been streamed, call .send() to end the stream and persist the message if persistence is enabled.
        """

        if not self.streaming:
            self.streaming = True
            step_dict = self.to_dict()
            await context.emitter.stream_start(step_dict)

        if is_sequence:
            self.content = token
        else:
            self.content += token

        assert self.id
        await context.emitter.send_token(
            id=self.id, token=token, is_sequence=is_sequence
        )


class Message(MessageBase):
    """
    Send a message to the UI

    Args:
        content (Union[str, Dict]): The content of the message.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        actions (List[Action], optional): A list of actions to send with the message.
        elements (List[ElementBased], optional): A list of elements to send with the message.
        disable_feedback (bool, optional): Hide the feedback buttons for this specific message
    """

    def __init__(
        self,
        content: Union[str, Dict],
        author: str = config.ui.name,
        language: Optional[str] = None,
        actions: Optional[List[Action]] = None,
        elements: Optional[List[ElementBased]] = None,
        disable_feedback: bool = False,
        type: MessageStepType = "assistant_message",
        id: Optional[str] = None,
        created_at: Union[str, None] = None,
    ):
        time.sleep(0.001)
        self.language = language

        if isinstance(content, dict):
            try:
                self.content = json.dumps(content, indent=4, ensure_ascii=False)
                self.language = "json"
            except TypeError:
                self.content = str(content)
                self.language = "text"
        elif isinstance(content, str):
            self.content = content
        else:
            self.content = str(content)
            self.language = "text"

        if id:
            self.id = str(id)

        if created_at:
            self.created_at = created_at

        self.author = author
        self.type = type
        self.actions = actions if actions is not None else []
        self.elements = elements if elements is not None else []
        self.disable_feedback = disable_feedback

        super().__post_init__()

    async def send(self) -> str:
        """
        Send the message to the UI and persist it in the cloud if a project ID is configured.
        Return the ID of the message.
        """
        trace_event("send_message")
        await super().send()

        context.session.root_message = self

        # Create tasks for all actions and elements
        tasks = [action.send(for_id=self.id) for action in self.actions]
        tasks.extend(element.send(for_id=self.id) for element in self.elements)

        # Run all tasks concurrently
        await asyncio.gather(*tasks)

        return self.id

    async def update(self):
        """
        Send the message to the UI and persist it in the cloud if a project ID is configured.
        Return the ID of the message.
        """
        trace_event("send_message")
        await super().update()

        # Update tasks for all actions and elements
        tasks = [
            action.send(for_id=self.id)
            for action in self.actions
            if action.forId is None
        ]
        tasks.extend(element.send(for_id=self.id) for element in self.elements)

        # Run all tasks concurrently
        await asyncio.gather(*tasks)

        return True

    async def remove_actions(self):
        for action in self.actions:
            await action.remove()


class ErrorMessage(MessageBase):
    """
    Send an error message to the UI
    If a project ID is configured, the message will be persisted in the cloud.

    Args:
        content (str): Text displayed above the upload button.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        parent_id (str, optional): If provided, the message will be nested inside the parent in the UI.
        indent (int, optional): If positive, the message will be nested in the UI.
    """

    def __init__(
        self,
        content: str,
        author: str = config.ui.name,
        fail_on_persist_error: bool = False,
    ):
        self.content = content
        self.author = author
        self.type = "system_message"
        self.is_error = True
        self.fail_on_persist_error = fail_on_persist_error

        super().__post_init__()

    async def send(self):
        """
        Send the error message to the UI and persist it in the cloud if a project ID is configured.
        Return the ID of the message.
        """
        trace_event("send_error_message")
        return await super().send()


class AskMessageBase(MessageBase):
    async def remove(self):
        removed = await super().remove()
        if removed:
            await context.emitter.clear("clear_ask")


class AskUserMessage(AskMessageBase):
    """
    Ask for the user input before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the message will be uploaded to the cloud storage.

    Args:
        content (str): The content of the prompt.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        disable_feedback (bool, optional): Hide the feedback buttons for this specific message
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.
        raise_on_timeout (bool, optional): Whether to raise a socketio TimeoutError if the user does not answer in time.
    """

    def __init__(
        self,
        content: str,
        author: str = config.ui.name,
        type: MessageStepType = "assistant_message",
        disable_feedback: bool = False,
        timeout: int = 60,
        raise_on_timeout: bool = False,
    ):
        self.content = content
        self.author = author
        self.timeout = timeout
        self.type = type
        self.disable_feedback = disable_feedback
        self.raise_on_timeout = raise_on_timeout

        super().__post_init__()

    async def send(self) -> Union[StepDict, None]:
        """
        Sends the question to ask to the UI and waits for the reply.
        """
        trace_event("send_ask_user")
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        if self.streaming:
            self.streaming = False

        self.wait_for_answer = True

        step_dict = await self._create()

        spec = AskSpec(type="text", timeout=self.timeout)

        res = cast(
            Union[None, StepDict],
            await context.emitter.send_ask_user(step_dict, spec, self.raise_on_timeout),
        )

        self.wait_for_answer = False

        return res


class AskFileMessage(AskMessageBase):
    """
    Ask the user to upload a file before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the file will be uploaded to the cloud storage.

    Args:
        content (str): Text displayed above the upload button.
        accept (Union[List[str], Dict[str, List[str]]]): List of mime type to accept like ["text/csv", "application/pdf"] or a dict like {"text/plain": [".txt", ".py"]}.
        max_size_mb (int, optional): Maximum size per file in MB. Maximum value is 100.
        max_files (int, optional): Maximum number of files to upload. Maximum value is 10.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        disable_feedback (bool, optional): Hide the feedback buttons for this specific message
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.
        raise_on_timeout (bool, optional): Whether to raise a socketio TimeoutError if the user does not answer in time.
    """

    def __init__(
        self,
        content: str,
        accept: Union[List[str], Dict[str, List[str]]],
        max_size_mb=2,
        max_files=1,
        author=config.ui.name,
        type: MessageStepType = "assistant_message",
        disable_feedback: bool = False,
        timeout=90,
        raise_on_timeout=False,
    ):
        self.content = content
        self.max_size_mb = max_size_mb
        self.max_files = max_files
        self.accept = accept
        self.type = type
        self.author = author
        self.timeout = timeout
        self.raise_on_timeout = raise_on_timeout
        self.disable_feedback = disable_feedback

        super().__post_init__()

    async def send(self) -> Union[List[AskFileResponse], None]:
        """
        Sends the message to request a file from the user to the UI and waits for the reply.
        """
        trace_event("send_ask_file")

        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

        if self.streaming:
            self.streaming = False

        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        self.wait_for_answer = True

        step_dict = await self._create()

        spec = AskFileSpec(
            type="file",
            accept=self.accept,
            max_size_mb=self.max_size_mb,
            max_files=self.max_files,
            timeout=self.timeout,
        )

        res = cast(
            Union[None, List[FileDict]],
            await context.emitter.send_ask_user(step_dict, spec, self.raise_on_timeout),
        )

        self.wait_for_answer = False

        if res:
            return [
                AskFileResponse(
                    id=r["id"],
                    name=r["name"],
                    path=str(r["path"]),
                    size=r["size"],
                    type=r["type"],
                )
                for r in res
            ]
        else:
            return None


class AskActionMessage(AskMessageBase):
    """
    Ask the user to select an action before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    """

    def __init__(
        self,
        content: str,
        actions: List[Action],
        author=config.ui.name,
        disable_feedback=False,
        timeout=90,
        raise_on_timeout=False,
    ):
        self.content = content
        self.actions = actions
        self.author = author
        self.disable_feedback = disable_feedback
        self.timeout = timeout
        self.raise_on_timeout = raise_on_timeout

        super().__post_init__()

    async def send(self) -> Union[AskActionResponse, None]:
        """
        Sends the question to ask to the UI and waits for the reply
        """
        trace_event("send_ask_action")

        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()

        if self.streaming:
            self.streaming = False

        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        self.wait_for_answer = True

        step_dict = await self._create()

        action_keys = []

        for action in self.actions:
            action_keys.append(action.id)
            await action.send(for_id=str(step_dict["id"]))

        spec = AskActionSpec(type="action", timeout=self.timeout, keys=action_keys)

        res = cast(
            Union[AskActionResponse, None],
            await context.emitter.send_ask_user(step_dict, spec, self.raise_on_timeout),
        )

        for action in self.actions:
            await action.remove()
        if res is None:
            self.content = "Timed out: no action was taken"
        else:
            self.content = f'**Selected action:** {res["label"]}'

        self.wait_for_answer = False

        await self.update()

        return res
