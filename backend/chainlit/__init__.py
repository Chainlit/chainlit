import os

from dotenv import load_dotenv

# ruff: noqa: E402
# Keep this here to ensure imports have environment available.
env_found = load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))

from chainlit.logger import logger

if env_found:
    logger.info("Loaded .env file")

import asyncio
from typing import TYPE_CHECKING, Any, Awaitable, Callable, Dict, List, Optional

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
from chainlit.oauth.providers import get_configured_oauth_providers
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
    config.code.oauth_callback = wrap_user_function(func)
    return func


@trace
def custom_authenticate_user(func: Callable[[str], Awaitable[User]]) -> Callable:
    """
    A decorator to authenticate the user via custom token validation.

    Args:
        func (Callable[[str, str, Dict[str, str], User], Optional[User]]): The authentication callback to execute.

    Returns:
        Callable[[str, str, Dict[str, str], User], Optional[User]]: The decorated authentication callback.
    """

    if len(get_configured_oauth_providers()) == 0:
        raise ValueError(
            "You must set the environment variable for at least one oauth provider to use oauth authentication."
        )

    config.code.custom_authenticate_user = wrap_user_function(func)
    return func


@trace
def custom_oauth_provider(func: Callable[[str], Awaitable[User]]) -> Callable:
    """
    A decorator to integrate custom OAuth provider logic for user authentication.

    Args:
        func (Callable[[str, str, Dict[str, str], User], Optional[User]]): A function that returns an instance of the OAuthProvider class, encapsulating the logic and details for the custom OAuth provider.

    Returns:
        Callable[[str, str, Dict[str, str], User], Optional[User]]: The decorated callback function that handles authentication via the custom OAuth provider.
    """

    if len(get_configured_oauth_providers()) == 0:
        raise ValueError(
            "You must set the environment variable for at least one oauth provider to use oauth authentication."
        )

    config.code.custom_oauth_provider = wrap_user_function(func)
    return func


@trace
def on_logout(func: Callable[[Request, Response], Any]) -> Callable:
    """
    Function called when the user logs out.
    Takes the FastAPI request and response as parameters.
    """

    config.code.on_logout = wrap_user_function(func)
    return func


@trace
def on_message(func: Callable) -> Callable:
    """
    Framework agnostic decorator to react to messages coming from the UI.
    The decorated function is called every time a new message is received.

    Args:
        func (Callable[[Message], Any]): The function to be called when a new message is received. Takes a cl.Message.

    Returns:
        Callable[[str], Any]: The decorated on_message function.
    """

    async def with_parent_id(message: Message):
        async with Step(name="on_message", type="run", parent_id=message.id) as s:
            s.input = message.content
            if len(inspect.signature(func).parameters) > 0:
                await func(message)
            else:
                await func()

    config.code.on_message = wrap_user_function(with_parent_id)
    return func


@trace
def on_chat_start(func: Callable) -> Callable:
    """
    Hook to react to the user websocket connection event.

    Args:
        func (Callable[], Any]): The connection hook to execute.

    Returns:
        Callable[], Any]: The decorated hook.
    """

    config.code.on_chat_start = wrap_user_function(
        step(func, name="on_chat_start", type="run"), with_task=True
    )
    return func


@trace
def on_chat_resume(func: Callable[[ThreadDict], Any]) -> Callable:
    """
    Hook to react to resume websocket connection event.

    Args:
        func (Callable[], Any]): The connection hook to execute.

    Returns:
        Callable[], Any]: The decorated hook.
    """

    config.code.on_chat_resume = wrap_user_function(func, with_task=True)
    return func


@trace
def set_chat_profiles(
    func: Callable[[Optional["User"]], List["ChatProfile"]]
) -> Callable:
    """
    Programmatic declaration of the available chat profiles (can depend on the User from the session if authentication is setup).

    Args:
        func (Callable[[Optional["User"]], List["ChatProfile"]]): The function declaring the chat profiles.

    Returns:
        Callable[[Optional["User"]], List["ChatProfile"]]: The decorated function.
    """

    config.code.set_chat_profiles = wrap_user_function(func)
    return func


@trace
def set_starters(func: Callable[[Optional["User"]], List["Starter"]]) -> Callable:
    """
    Programmatic declaration of the available starter (can depend on the User from the session if authentication is setup).

    Args:
        func (Callable[[Optional["User"]], List["Starter"]]): The function declaring the starters.

    Returns:
        Callable[[Optional["User"]], List["Starter"]]: The decorated function.
    """

    config.code.set_starters = wrap_user_function(func)
    return func


@trace
def on_chat_end(func: Callable) -> Callable:
    """
    Hook to react to the user websocket disconnect event.

    Args:
        func (Callable[], Any]): The disconnect hook to execute.

    Returns:
        Callable[], Any]: The decorated hook.
    """

    config.code.on_chat_end = wrap_user_function(func, with_task=True)
    return func


@trace
def on_audio_chunk(func: Callable) -> Callable:
    """
    Hook to react to the audio chunks being sent.

    Args:
        chunk (AudioChunk): The audio chunk being sent.

    Returns:
        Callable[], Any]: The decorated hook.
    """

    config.code.on_audio_chunk = wrap_user_function(func, with_task=False)
    return func


@trace
def on_audio_end(func: Callable) -> Callable:
    """
    Hook to react to the audio stream ending. This is called after the last audio chunk is sent.

    Args:
    elements ([List[Element]): The files that were uploaded before starting the audio stream (if any).

    Returns:
        Callable[], Any]: The decorated hook.
    """

    config.code.on_audio_end = wrap_user_function(
        step(func, name="on_audio_end", type="run"), with_task=True
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
