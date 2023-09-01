import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, List, Optional, Union

from chainlit.action import Action
from chainlit.client.base import MessageDict
from chainlit.config import config
from chainlit.context import context
from chainlit.element import ElementBased
from chainlit.logger import logger
from chainlit.prompt import Prompt
from chainlit.telemetry import trace_event
from chainlit.types import AskFileResponse, AskFileSpec, AskResponse, AskSpec


class MessageBase(ABC):
    id: str
    author: str
    content: str = ""
    streaming = False
    created_at: Union[int, str, None] = None
    fail_on_persist_error: bool = False
    persisted = False

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")
        if not getattr(self, "id", None):
            self.id = str(uuid.uuid4())
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()

    @abstractmethod
    def to_dict(self):
        pass

    async def _create(self):
        msg_dict = self.to_dict()
        if context.emitter.db_client and not self.persisted:
            try:
                persisted_id = await context.emitter.db_client.create_message(msg_dict)
                if persisted_id:
                    msg_dict["id"] = persisted_id
                    self.id = persisted_id
                    self.persisted = True
            except Exception as e:
                if self.fail_on_persist_error:
                    raise e
                logger.error(f"Failed to persist message: {str(e)}")

        return msg_dict

    async def update(
        self,
    ):
        """
        Update a message already sent to the UI.
        """
        trace_event("update_message")

        msg_dict = self.to_dict()

        if context.emitter.db_client and self.id:
            await context.emitter.db_client.update_message(self.id, msg_dict)

        await context.emitter.update_message(msg_dict)

        return True

    async def remove(self):
        """
        Remove a message already sent to the UI.
        This will not automatically remove potential nested messages and could lead to undesirable side effects in the UI.
        """
        trace_event("remove_message")

        if context.emitter.db_client and self.id:
            await context.emitter.db_client.delete_message(self.id)

        await context.emitter.delete_message(self.to_dict())

        return True

    async def send(self):
        if self.content is None:
            self.content = ""

        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        msg_dict = await self._create()

        if self.streaming:
            self.streaming = False

        await context.emitter.send_message(msg_dict)

        return self.id

    async def stream_token(self, token: str, is_sequence=False):
        """
        Sends a token to the UI. This is useful for streaming messages.
        Once all tokens have been streamed, call .send() to end the stream and persist the message if persistence is enabled.
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


class Message(MessageBase):
    """
    Send a message to the UI
    If a project ID is configured, the message will be persisted in the cloud.

    Args:
        content (Union[str, Dict]): The content of the message.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        prompt (Prompt, optional): The prompt used to generate the message. If provided, enables the prompt playground for this message.
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        parent_id (str, optional): If provided, the message will be nested inside the parent in the UI.
        indent (int, optional): If positive, the message will be nested in the UI. (deprecated, use parent_id instead)
        actions (List[Action], optional): A list of actions to send with the message.
        elements (List[ElementBased], optional): A list of elements to send with the message.
    """

    def __init__(
        self,
        content: Union[str, Dict],
        author: str = config.ui.name,
        prompt: Optional[Prompt] = None,
        language: Optional[str] = None,
        parent_id: Optional[str] = None,
        indent: int = 0,
        actions: Optional[List[Action]] = None,
        elements: Optional[List[ElementBased]] = None,
    ):
        self.language = language

        if isinstance(content, dict):
            self.content = json.dumps(content, indent=4)
            self.language = "json"
        elif isinstance(content, str):
            self.content = content
        else:
            logger.warn(
                f"Unsupported type {type(content)} for message content. Attempting to stringify it"
            )
            self.content = str(content)

        self.author = author
        self.prompt = prompt
        self.parent_id = parent_id
        self.indent = indent
        self.actions = actions if actions is not None else []
        self.elements = elements if elements is not None else []

        super().__post_init__()

    @classmethod
    def from_dict(self, _dict: MessageDict):
        message = Message(
            content=_dict["content"],
            author=_dict.get("author", config.ui.name),
            prompt=_dict.get("prompt"),
            language=_dict.get("language"),
            parent_id=_dict.get("parentId"),
            indent=_dict.get("indent") or 0,
        )

        if _id := _dict.get("id"):
            message.id = _id
        if created_at := _dict.get("createdAt"):
            message.created_at = created_at

        return message

    def to_dict(self):
        _dict = {
            "createdAt": self.created_at,
            "content": self.content,
            "author": self.author,
            "language": self.language,
            "parentId": self.parent_id,
            "indent": self.indent,
            "streaming": self.streaming,
        }

        if self.prompt:
            _dict["prompt"] = self.prompt.to_dict()

        if self.id:
            _dict["id"] = self.id

        return _dict

    async def send(self) -> str:
        """
        Send the message to the UI and persist it in the cloud if a project ID is configured.
        Return the ID of the message.
        """
        trace_event("send_message")
        id = await super().send()

        if not self.parent_id:
            context.session.root_message = self

        for action in self.actions:
            await action.send(for_id=str(id))

        for element in self.elements:
            await element.send(for_id=str(id))

        return id

    async def update(self):
        """
        Send the message to the UI and persist it in the cloud if a project ID is configured.
        Return the ID of the message.
        """
        trace_event("send_message")
        await super().update()

        actions_to_update = [action for action in self.actions if action.forId is None]

        elements_to_update = [el for el in self.elements if self.id not in el.for_ids]

        for action in actions_to_update:
            await action.send(for_id=self.id)

        for element in elements_to_update:
            await element.send(for_id=self.id)

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
        indent (int, optional): If positive, the message will be nested in the UI.
    """

    def __init__(
        self,
        content: str,
        author: str = config.ui.name,
        indent: int = 0,
        fail_on_persist_error: bool = False,
    ):
        self.content = content
        self.author = author
        self.indent = indent
        self.fail_on_persist_error = fail_on_persist_error

        super().__post_init__()

    def to_dict(self):
        return {
            "id": self.id,
            "createdAt": self.created_at,
            "content": self.content,
            "author": self.author,
            "indent": self.indent,
            "isError": True,
        }

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
            await context.emitter.clear_ask()


class AskUserMessage(AskMessageBase):
    """
    Ask for the user input before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the message will be uploaded to the cloud storage.

    Args:
        content (str): The content of the prompt.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.
        raise_on_timeout (bool, optional): Whether to raise a socketio TimeoutError if the user does not answer in time.
    """

    def __init__(
        self,
        content: str,
        author: str = config.ui.name,
        timeout: int = 60,
        raise_on_timeout: bool = False,
    ):
        self.content = content
        self.author = author
        self.timeout = timeout
        self.raise_on_timeout = raise_on_timeout

        super().__post_init__()

    def to_dict(self):
        return {
            "id": self.id,
            "createdAt": self.created_at,
            "content": self.content,
            "author": self.author,
            "waitForAnswer": True,
        }

    async def send(self) -> Union[AskResponse, None]:
        """
        Sends the question to ask to the UI and waits for the reply.
        """
        trace_event("send_ask_user")

        if self.streaming:
            self.streaming = False

        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        msg_dict = await self._create()

        spec = AskSpec(type="text", timeout=self.timeout)

        res = await context.emitter.send_ask_user(msg_dict, spec, self.raise_on_timeout)

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
        timeout=90,
        raise_on_timeout=False,
    ):
        self.content = content
        self.max_size_mb = max_size_mb
        self.max_files = max_files
        self.accept = accept
        self.author = author
        self.timeout = timeout
        self.raise_on_timeout = raise_on_timeout

        super().__post_init__()

    def to_dict(self):
        return {
            "id": self.id,
            "createdAt": self.created_at,
            "content": self.content,
            "author": self.author,
            "waitForAnswer": True,
        }

    async def send(self) -> Union[List[AskFileResponse], None]:
        """
        Sends the message to request a file from the user to the UI and waits for the reply.
        """
        trace_event("send_ask_file")

        if self.streaming:
            self.streaming = False

        if config.code.author_rename:
            self.author = await config.code.author_rename(self.author)

        msg_dict = await self._create()

        spec = AskFileSpec(
            type="file",
            accept=self.accept,
            max_size_mb=self.max_size_mb,
            max_files=self.max_files,
            timeout=self.timeout,
        )

        res = await context.emitter.send_ask_user(msg_dict, spec, self.raise_on_timeout)

        if res:
            return [AskFileResponse(**r) for r in res]
        else:
            return None
