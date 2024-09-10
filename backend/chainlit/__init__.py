import os

from dotenv import load_dotenv

# ruff: noqa: E402
# Keep this here to ensure imports have environment available.
env_found = load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))

from chainlit.logger import logger

if env_found:
    logger.info("Loaded .env file")

import asyncio
from typing import TYPE_CHECKING, Any, Dict

import chainlit.input_widget as input_widget
from chainlit.action import Action
from chainlit.cache import cache
from chainlit.chat_context import chat_context
from chainlit.chat_settings import ChatSettings
from chainlit.context import context
from chainlit.element import (
    Audio,
    Component,
    File,
    Image,
    Pdf,
    Plotly,
    Pyplot,
    Task,
    TaskList,
    TaskStatus,
    Text,
    Video,
)
from chainlit.message import (
    AskActionMessage,
    AskFileMessage,
    AskUserMessage,
    ErrorMessage,
    Message,
)
from chainlit.step import Step, step
from chainlit.sync import make_async, run_sync
from chainlit.types import AudioChunk, ChatProfile, Starter
from chainlit.user import PersistedUser, User
from chainlit.user_session import user_session
from chainlit.utils import make_module_getattr
from chainlit.version import __version__
from literalai import ChatGeneration, CompletionGeneration, GenerationMessage
from pydantic.dataclasses import dataclass

from .callbacks import (
    action_callback,
    author_rename,
    header_auth_callback,
    oauth_callback,
    on_audio_chunk,
    on_audio_end,
    on_chat_end,
    on_chat_resume,
    on_chat_start,
    on_logout,
    on_message,
    on_settings_update,
    on_stop,
    password_auth_callback,
    set_chat_profiles,
    set_starters,
)

if TYPE_CHECKING:
    from chainlit.haystack.callbacks import HaystackAgentCallbackHandler
    from chainlit.langchain.callbacks import (
        AsyncLangchainCallbackHandler,
        LangchainCallbackHandler,
    )
    from chainlit.llama_index.callbacks import LlamaIndexCallbackHandler
    from chainlit.mistralai import instrument_mistralai
    from chainlit.openai import instrument_openai


def sleep(duration: int):
    """
    Sleep for a given duration.
    Args:
        duration (int): The duration in seconds.
    """
    return asyncio.sleep(duration)


@dataclass()
class CopilotFunction:
    name: str
    args: Dict[str, Any]

    def acall(self):
        return context.emitter.send_call_fn(self.name, self.args)


__getattr__ = make_module_getattr(
    {
        "LangchainCallbackHandler": "chainlit.langchain.callbacks",
        "AsyncLangchainCallbackHandler": "chainlit.langchain.callbacks",
        "LlamaIndexCallbackHandler": "chainlit.llama_index.callbacks",
        "HaystackAgentCallbackHandler": "chainlit.haystack.callbacks",
        "instrument_openai": "chainlit.openai",
        "instrument_mistralai": "chainlit.mistralai",
    }
)

__all__ = [
    "__version__",
    "ChatProfile",
    "Starter",
    "user_session",
    "chat_context",
    "CopilotFunction",
    "AudioChunk",
    "Action",
    "User",
    "PersistedUser",
    "Audio",
    "Pdf",
    "Plotly",
    "Image",
    "Text",
    "Component",
    "Pyplot",
    "File",
    "Task",
    "TaskList",
    "TaskStatus",
    "Video",
    "ChatSettings",
    "input_widget",
    "Message",
    "ErrorMessage",
    "AskUserMessage",
    "AskActionMessage",
    "AskFileMessage",
    "Step",
    "step",
    "ChatGeneration",
    "CompletionGeneration",
    "GenerationMessage",
    "on_logout",
    "on_chat_start",
    "on_chat_end",
    "on_chat_resume",
    "on_stop",
    "action_callback",
    "author_rename",
    "on_settings_update",
    "password_auth_callback",
    "header_auth_callback",
    "sleep",
    "run_sync",
    "make_async",
    "cache",
    "context",
    "LangchainCallbackHandler",
    "AsyncLangchainCallbackHandler",
    "LlamaIndexCallbackHandler",
    "HaystackAgentCallbackHandler",
    "instrument_openai",
    "instrument_mistralai",
    "password_auth_callback",
    "header_auth_callback",
    "oauth_callback",
    "on_logout",
    "on_message",
    "on_chat_start",
    "on_chat_resume",
    "set_chat_profiles",
    "set_starters",
    "on_chat_end",
    "on_audio_chunk",
    "on_audio_end",
    "author_rename",
    "on_stop",
    "action_callback",
    "on_settings_update",
]


def __dir__():
    return __all__
