from typing import List, Dict, Union
import uuid
import time
from abc import ABC, abstractmethod
from chainlit.telemetry import trace_event
from chainlit.logger import logger
from chainlit.sdk import get_sdk, Chainlit
from chainlit.telemetry import trace_event
from chainlit.config import config
from chainlit.types import (
    LLMSettings,
    AskSpec,
    AskFileSpec,
    AskFileResponse,
    AskResponse,
)
from chainlit.element import Element
from chainlit.action import Action


def current_milli_time():
    """Get the current time in milliseconds."""
    return round(time.time() * 1000)


class MessageBase(ABC):
    id: int = None
    temp_id: str = None
    streaming = False

    @abstractmethod
    def to_dict(self):
        pass

    def _create(self, sdk: Chainlit):
        msg_dict = self.to_dict()
        if sdk.client:
            self.id = sdk.client.create_message(msg_dict)
            if self.id:
                msg_dict["id"] = self.id

        if not "id" in msg_dict:
            self.temp_id = uuid.uuid4().hex
            msg_dict["tempId"] = self.temp_id

        msg_dict["createdAt"] = current_milli_time()

        return msg_dict

    def update(
        self,
        author: str = None,
        content: str = None,
        language: str = None,
        prompt: str = None,
        llm_settings: LLMSettings = None,
    ):
        """
        Update a message already sent to the UI.
        """
        trace_event("update_message")

        sdk = get_sdk()

        if not sdk:
            logger.warning("No SDK found, cannot update message")
            return False

        if author:
            self.author = author
        if content:
            self.content = content
        if language:
            self.language = language
        if prompt:
            self.prompt = prompt
        if llm_settings:
            self.llmSettings = llm_settings

        msg_dict = self.to_dict()

        if sdk.client and self.id:
            sdk.client.update_message(self.id, msg_dict)
            msg_dict["id"] = self.id
        elif self.temp_id:
            msg_dict["tempId"] = self.temp_id
        else:
            logger.error("Cannot update a message that has no ID")
            return False

        sdk.update_message(msg_dict)

        return True

    def remove(self):
        """
        Remove a message already sent to the UI.
        This will not automatically remove potential nested messages and could lead to undesirable side effects in the UI.
        """
        trace_event("remove_message")

        sdk = get_sdk()

        if not sdk:
            logger.warning("No SDK found, cannot delete message")
            return False
        if sdk.client and self.id:
            sdk.client.delete_message(self.id)
            sdk.delete_message(self.id)
        elif self.temp_id:
            sdk.delete_message(self.temp_id)
        else:
            logger.error("Cannot delete a message that has no ID")
            return False

        return True

    def send(self) -> Union[str, int]:
        sdk = get_sdk()

        if not sdk:
            logger.warning("No SDK found, cannot send message")
            return

        msg_dict = self._create(sdk)

        if self.streaming:
            self.streaming = False
            sdk.stream_end(msg_dict)
        else:
            sdk.send_message(msg_dict)

        return self.id or self.temp_id

    def stream_token(self, token: str):
        """
        Sends a token to the UI. This is useful for streaming messages.
        Once all tokens have been streamed, call .send() to persist the message.
        """
        sdk = get_sdk()

        if not sdk:
            logger.warning("No SDK found, cannot send message")
            return

        if not self.streaming:
            self.streaming = True
            msg_dict = self.to_dict()
            sdk.stream_start(msg_dict)

        self.content += token
        sdk.send_token(token)


class Message(MessageBase):
    """
    Send a message to the UI
    If a project ID is configured, the message will be persisted in the cloud.

    Args:
        content (str): The content of the message.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        prompt (str, optional): The prompt used to generate the message. If provided, enables the prompt playground for this message.
        llm_settings (LLMSettings, optional): Settings of the LLM used to generate the prompt. This is useful for debug purposes in the prompt playground.
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        indent (int, optional): If positive, the message will be nested in the UI.
        actions (List[Action], optional): A list of actions to send with the message.
        elements (List[Element], optional): A list of elements to send with the message.
    """

    def __init__(
        self,
        content: str,
        author: str = config.chatbot_name,
        prompt: str = None,
        llm_settings: LLMSettings = None,
        language: str = None,
        indent: int = 0,
        actions: List[Action] = [],
        elements: List[Element] = [],
    ):
        self.content = content
        self.author = author
        self.prompt = prompt
        self.language = language
        self.indent = indent
        self.actions = actions
        self.elements = elements
        self.llmSettings = None

        if llm_settings is None and prompt is not None:
            self.llmSettings = LLMSettings().to_dict()

        if llm_settings:
            self.llmSettings = llm_settings.to_dict()

    def to_dict(self):
        return {
            "content": self.content,
            "author": self.author,
            "prompt": self.prompt,
            "llmSettings": self.llmSettings,
            "language": self.language,
            "indent": self.indent,
        }

    def send(self):
        """
        Send the message to the UI and persist it in the cloud if a project ID is configured.
        Return the ID of the message.
        """
        trace_event("send_message")
        id = super().send()

        for action in self.actions:
            action.send(for_id=str(id))

        for element in self.elements:
            element.send(for_id=str(id))

        return id


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
        author: str = config.chatbot_name,
        indent: int = 0,
    ):
        self.content = content
        self.author = author
        self.indent = indent

    def to_dict(self):
        return {
            "content": self.content,
            "author": self.author,
            "indent": self.indent,
            "isError": True,
        }

    def send(self):
        """
        Send the error message to the UI and persist it in the cloud if a project ID is configured.
        Return the ID of the message.
        """
        trace_event("send_error_message")
        id = super().send()

        return id


class AskMessageBase(MessageBase):
    def remove(self):
        removed = super().remove()
        if removed:
            sdk = get_sdk()

            if not sdk:
                return

            sdk.clear_ask()


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
        author: str = config.chatbot_name,
        timeout: int = 60,
        raise_on_timeout: bool = False,
    ):
        self.content = content
        self.author = author
        self.timeout = timeout
        self.raise_on_timeout = raise_on_timeout

    def to_dict(self):
        return {
            "content": self.content,
            "author": self.author,
            "waitForAnswer": True,
        }

    def send(self) -> Union[AskResponse, None]:
        """
        Sends the question to ask to the UI and waits for the reply.
        """
        trace_event("send_ask_user")

        sdk = get_sdk()

        if not sdk:
            logger.warning("No SDK found, cannot send message")
            return

        if self.streaming:
            self.streaming = False

        msg_dict = self._create(sdk)

        spec = AskSpec(type="text", timeout=self.timeout)

        return sdk.send_ask_user(msg_dict, spec, self.raise_on_timeout)


class AskFileMessage(AskMessageBase):
    """
    Ask the user to upload a file before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the file will be uploaded to the cloud storage.

    Args:
        content (str): Text displayed above the upload button.
        accept (Union[List[str], Dict[str, List[str]]]): List of mime type to accept like ["text/csv", "application/pdf"] or a dict like {"text/plain": [".txt", ".py"]}.
        max_size_mb (int, optional): Maximum file size in MB. Maximum value is 100.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.
        raise_on_timeout (bool, optional): Whether to raise a socketio TimeoutError if the user does not answer in time.
    """

    def __init__(
        self,
        content: str,
        accept: Union[List[str], Dict[str, List[str]]],
        max_size_mb=2,
        author=config.chatbot_name,
        timeout=90,
        raise_on_timeout=False,
    ):
        self.content = content
        self.max_size_mb = max_size_mb
        self.accept = accept
        self.author = author
        self.timeout = timeout
        self.raise_on_timeout = raise_on_timeout

    def to_dict(self):
        return {
            "content": self.content,
            "author": self.author,
            "waitForAnswer": True,
        }

    def send(self) -> Union[AskFileResponse, None]:
        """
        Sends the message to request a file from the user to the UI and waits for the reply.
        """
        trace_event("send_ask_file")

        sdk = get_sdk()

        if not sdk:
            logger.warning("No SDK found, cannot send message")
            return

        if self.streaming:
            self.streaming = False

        msg_dict = self._create(sdk)

        spec = AskFileSpec(
            type="file",
            accept=self.accept,
            max_size_mb=self.max_size_mb,
            timeout=self.timeout,
        )

        res = sdk.send_ask_user(msg_dict, spec, self.raise_on_timeout)

        if res:
            return AskFileResponse(**res)
        else:
            return None
