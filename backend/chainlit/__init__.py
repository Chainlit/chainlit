import os

from dotenv import load_dotenv

env_found = load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))

import asyncio
from typing import TYPE_CHECKING, Any, Callable, Dict, List, Optional, Union

from starlette.datastructures import Headers

if TYPE_CHECKING:
    from chainlit.haystack.callbacks import HaystackAgentCallbackHandler
    from chainlit.langchain.callbacks import (
        LangchainCallbackHandler,
        AsyncLangchainCallbackHandler,
    )
    from chainlit.llama_index.callbacks import LlamaIndexCallbackHandler

import chainlit.input_widget as input_widget
from chainlit.action import Action
from chainlit.cache import cache
from chainlit.chat_settings import ChatSettings
from chainlit.config import config
from chainlit.element import (
    Audio,
    Avatar,
    File,
    Image,
    Pdf,
    Pyplot,
    Task,
    TaskList,
    TaskStatus,
    Text,
    Video,
)
from chainlit.logger import logger
from chainlit.message import AskFileMessage, AskUserMessage, ErrorMessage, Message
from chainlit.oauth_providers import get_configured_oauth_providers
from chainlit.sync import make_async, run_sync
from chainlit.telemetry import trace
from chainlit.types import AppUser, FileSpec
from chainlit.user_session import user_session
from chainlit.utils import make_module_getattr, wrap_user_function
from chainlit.version import __version__

if env_found:
    logger.info("Loaded .env file")


@trace
def password_auth_callback(func: Callable[[str, str], Optional[AppUser]]) -> Callable:
    """
    Framework agnostic decorator to authenticate the user.

    Args:
        func (Callable[[str, str], Optional[AppUser]]): The authentication callback to execute. Takes the email and password as parameters.

    Example:
        @cl.password_auth_callback
        async def password_auth_callback(username: str, password: str) -> Optional[AppUser]:

    Returns:
        Callable[[str, str], Optional[AppUser]]: The decorated authentication callback.
    """

    config.code.password_auth_callback = wrap_user_function(func)
    return func


@trace
def header_auth_callback(func: Callable[[Headers], Optional[AppUser]]) -> Callable:
    """
    Framework agnostic decorator to authenticate the user via a header

    Args:
        func (Callable[[Headers], Optional[AppUser]]): The authentication callback to execute.

    Example:
        @cl.header_auth_callback
        async def header_auth_callback(headers: Headers) -> Optional[AppUser]:

    Returns:
        Callable[[Headers], Optional[AppUser]]: The decorated authentication callback.
    """

    config.code.header_auth_callback = wrap_user_function(func)
    return func


@trace
def oauth_callback(
    func: Callable[[str, str, Dict[str, str], AppUser], Optional[AppUser]]
) -> Callable:
    """
    Framework agnostic decorator to authenticate the user via oauth

    Args:
        func (Callable[[str, str, Dict[str, str], AppUser], Optional[AppUser]]): The authentication callback to execute.

    Example:
        @cl.oauth_callback
        async def oauth_callback(provider_id: str, token: str, raw_user_data: Dict[str, str], default_app_user: AppUser) -> Optional[AppUser]:

    Returns:
        Callable[[str, str, Dict[str, str], AppUser], Optional[AppUser]]: The decorated authentication callback.
    """

    if len(get_configured_oauth_providers()) == 0:
        raise ValueError(
            "You must set the environment variable for at least one oauth provider to use oauth authentication."
        )

    config.code.oauth_callback = wrap_user_function(func)
    return func


@trace
def on_message(func: Callable) -> Callable:
    """
    Framework agnostic decorator to react to messages coming from the UI.
    The decorated function is called every time a new message is received.

    Args:
        func (Callable[[str, str], Any]): The function to be called when a new message is received. Takes the input message and the message id.

    Returns:
        Callable[[str], Any]: The decorated on_message function.
    """

    config.code.on_message = wrap_user_function(func)
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

    config.code.on_chat_start = wrap_user_function(func, with_task=True)
    return func


@trace
def author_rename(func: Callable[[str], str]) -> Callable[[str], str]:
    """
    Useful to rename the author of message to display more friendly author names in the UI.
    Args:
        func (Callable[[str], str]): The function to be called to rename an author. Takes the original author name as parameter.

    Returns:
        Callable[[Any, str], Any]: The decorated function.
    """

    config.code.author_rename = wrap_user_function(func)
    return func


@trace
def on_stop(func: Callable) -> Callable:
    """
    Hook to react to the user stopping a conversation.

    Args:
        func (Callable[[], Any]): The stop hook to execute.

    Returns:
        Callable[[], Any]: The decorated stop hook.
    """

    config.code.on_stop = wrap_user_function(func)
    return func


def action_callback(name: str) -> Callable:
    """
    Callback to call when an action is clicked in the UI.

    Args:
        func (Callable[[Action], Any]): The action callback to execute. First parameter is the action.
    """

    def decorator(func: Callable[[Action], Any]):
        config.code.action_callbacks[name] = wrap_user_function(func, with_task=True)
        return func

    return decorator


def on_settings_update(
    func: Callable[[Dict[str, Any]], Any]
) -> Callable[[Dict[str, Any]], Any]:
    """
    Hook to react to the user changing any settings.

    Args:
        func (Callable[], Any]): The hook to execute after settings were changed.

    Returns:
        Callable[], Any]: The decorated hook.
    """

    config.code.on_settings_update = wrap_user_function(func, with_task=True)
    return func


def on_file_upload(
    accept: Union[List[str], Dict[str, List[str]]],
    max_size_mb: int = 2,
    max_files: int = 1,
) -> Callable:
    """
    A decorator designed for handling spontaneously uploaded files.
    This decorator is intended to be used with files that are uploaded on-the-fly.

    Args:
        accept (Union[List[str], Dict[str, List[str]]]): A list of accepted file extensions or a dictionary of extension lists per field.
        type (Optional[str]): The type of upload, defaults to "file".
        max_size_mb (Optional[int]): The maximum file size in megabytes, defaults to 2.
        max_files (Optional[int]): The maximum number of files allowed to be uploaded, defaults to 1.

    Returns:
        Callable: The decorated function for handling spontaneous file uploads.
    """

    def decorator(func: Callable) -> Callable:
        config.code.on_file_upload_config = FileSpec(
            accept=accept,
            max_size_mb=max_size_mb,
            max_files=max_files,
        )
        config.code.on_file_upload = wrap_user_function(func)
        return func

    return decorator


def sleep(duration: int):
    """
    Sleep for a given duration.
    Args:
        duration (int): The duration in seconds.
    """
    return asyncio.sleep(duration)


__getattr__ = make_module_getattr(
    {
        "LangchainCallbackHandler": "chainlit.langchain.callbacks",
        "AsyncLangchainCallbackHandler": "chainlit.langchain.callbacks",
        "LlamaIndexCallbackHandler": "chainlit.llama_index.callbacks",
        "HaystackAgentCallbackHandler": "chainlit.haystack.callbacks",
    }
)

__all__ = [
    "user_session",
    "Action",
    "AppUser",
    "Audio",
    "Pdf",
    "Image",
    "Text",
    "Avatar",
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
    "AskFileMessage",
    "on_chat_start",
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
    "LangchainCallbackHandler",
    "AsyncLangchainCallbackHandler",
    "LlamaIndexCallbackHandler",
    "HaystackAgentCallbackHandler",
]


def __dir__():
    return __all__
