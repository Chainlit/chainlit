import gevent
from gevent import monkey

monkey.patch_all()

from chainlit.lc import monkey

monkey.patch()

from chainlit.sdk import get_sdk
from chainlit.config import config
from chainlit.types import (
    LLMSettings,
    AskSpec,
    AskFileSpec,
    AskFileResponse,
    AskResponse,
)
from chainlit.telemetry import trace
from chainlit.version import __version__
from chainlit.logger import logger
from chainlit.server import socketio
from chainlit.action import Action
from chainlit.element import LocalImage, RemoteImage, Text
from chainlit.user_session import user_session
from typing import Callable, Any, List, Union
from dotenv import load_dotenv
import inspect
import os


env_found = load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))

if env_found:
    logger.info("Loaded .env file")


def wrap_user_function(user_function: Callable, with_task=False) -> Callable:
    """
    Wraps a user-defined function to accept arguments as a dictionary.

    Args:
        user_function (Callable): The user-defined function to wrap.

    Returns:
        Callable: The wrapped function.
    """

    def wrapper(*args):
        sdk = get_sdk()
        # Get the parameter names of the user-defined function
        user_function_params = list(inspect.signature(user_function).parameters.keys())

        # Create a dictionary of parameter names and their corresponding values from *args
        params_values = {
            param_name: arg for param_name, arg in zip(user_function_params, args)
        }

        if with_task and sdk:
            sdk.task_start()

        try:
            # Call the user-defined function with the arguments
            return user_function(**params_values)
        except Exception as e:
            logger.exception(e)
            if sdk:
                sdk.send_message(author="Error", is_error=True, content=str(e))
        finally:
            if with_task and sdk:
                sdk.task_end()

    return wrapper


@trace
def send_message(
    content: str,
    author=config.chatbot_name,
    prompt: str = None,
    language: str = None,
    indent=0,
    llm_settings: LLMSettings = None,
    end_stream=False,
    actions: List[Action] = [],
    elements: List[Union[LocalImage, RemoteImage, Text]] = [],
):
    """
    Send a message to the chatbot UI.
    If a project ID is configured, the message will be uploaded to the cloud storage.

    Args:
        content (str): The content of the message.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        prompt (str, optional): The prompt used to generate the message. If provided, enables the prompt playground for this message.
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        indent (int, optional): If positive, the message will be nested in the UI.
        llm_settings (LLMSettings, optional): Settings of the LLM used to generate the prompt. This is useful for debug purposes in the prompt playground.
        end_stream (bool, optional): Pass True if this message was streamed.

    Returns:
        str: The message ID.
    """
    sdk = get_sdk()
    if sdk:
        msg_id = sdk.send_message(
            author=author,
            content=content,
            prompt=prompt,
            language=language,
            indent=indent,
            llm_settings=llm_settings,
            end_stream=end_stream,
        )

        for action in actions:
            action.send(for_id=msg_id)

        for element in elements:
            element.send(for_id=msg_id)

        return msg_id


@trace
def send_error_message(content: str, author=config.chatbot_name, indent=0):
    """
    Send an error message to the chatbot UI.
    If a project ID is configured, the message will be uploaded to the cloud storage.

    Args:
        content (str): The error message.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        indent (int, optional): If positive, the message will be nested in the UI.
    """
    sdk = get_sdk()
    if sdk:
        return sdk.send_message(
            author=author, content=content, is_error=True, indent=indent
        )


@trace
def ask_for_input(
    content: str, author=config.chatbot_name, timeout=60, raise_on_timeout=False
) -> Union[AskResponse, None]:
    """
    Ask for the user input before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the message will be uploaded to the cloud storage.

    Args:
        content (str): The content of the prompt.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.
        raise_on_timeout (bool, optional): Whether to raise a socketio TimeoutError if the user does not answer in time.
    Returns:
        AskResponse: The response from the user include "msg" and "author" or None.
    """
    sdk = get_sdk()
    if sdk:
        spec = AskSpec(type="text", timeout=timeout)
        return sdk.send_ask_user(
            author=author, content=content, spec=spec, raise_on_timeout=raise_on_timeout
        )


@trace
def ask_for_file(
    title: str,
    accept: List[str],
    max_size_mb=2,
    author=config.chatbot_name,
    timeout=90,
    raise_on_timeout=False,
) -> Union[AskFileResponse, None]:
    """
    Ask the user to upload a file before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the file will be uploaded to the cloud storage.

    Args:
        title (str): Text displayed above the upload button.
        accept (List[str]): List of mime type to accept like ["text/csv", "application/pdf"]
        max_size_mb (int, optional): Maximum file size in MB.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.
        raise_on_timeout (bool, optional): Whether to raise a socketio TimeoutError if the user does not answer in time.
    Returns:
        FileContent: The file content or None.
    """
    sdk = get_sdk()
    if sdk:
        spec = AskFileSpec(
            type="file", accept=accept, max_size_mb=max_size_mb, timeout=timeout
        )
        res = sdk.send_ask_user(
            author=author, content=title, spec=spec, raise_on_timeout=raise_on_timeout
        )
        if res:
            return AskFileResponse(**res)
        else:
            return None


@trace
def start_stream(
    author=config.chatbot_name,
    indent: int = 0,
    language: str = None,
    llm_settings: LLMSettings = None,
):
    """
    Start a streamed message.

    Args:
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        indent (int, optional): If positive, the message will be nested in the UI.
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        llm_settings (LLMSettings, optional): Settings of the LLM used to generate the prompt. This is useful for debug purposes in the prompt playground.
    """
    sdk = get_sdk()
    if sdk:
        return sdk.stream_start(
            author=author, indent=indent, language=language, llm_settings=llm_settings
        )


@trace
def send_token(token: str):
    """
    Send a token belonging to the currently streamed message.

    Args:
        token (str): The token to send.
    """
    sdk = get_sdk()
    if sdk:
        return sdk.send_token(token)


@trace
def langchain_factory(func: Callable) -> Callable:
    """
    Plug and play decorator for the LangChain library.
    The decorated function should instantiate a new LangChain instance (Chain, Agent...).
    One instance per user session is created and cached.
    The per user instance is called every time a new message is received.

    Args:
        func (Callable[[], Any]): The factory function to create a new LangChain instance.

    Returns:
        Callable[[], Any]: The decorated factory function.
    """

    config.lc_factory = wrap_user_function(func, with_task=True)
    return func


@trace
def langchain_postprocess(func: Callable[[Any], str]) -> Callable:
    """
    Useful to post process the response a LangChain object instantiated with @langchain_factory.
    The decorated function takes the raw output of the LangChain object as input.
    The response will NOT be automatically sent to the UI, you need to call send_message.

    Args:
        func (Callable[[Any], str]): The post-processing function to apply after generating a response. Takes the response as parameter.

    Returns:
        Callable[[Any], str]: The decorated post-processing function.
    """

    config.lc_postprocess = wrap_user_function(func)
    return func


@trace
def on_message(func: Callable) -> Callable:
    """
    Framework agnostic decorator to react to messages coming from the UI.
    The decorated function is called every time a new message is received.

    Args:
        func (Callable[[str], Any]): The function to be called when a new message is received. Takes the input message.

    Returns:
        Callable[[str], Any]: The decorated on_message function.
    """

    config.on_message = wrap_user_function(func)
    return func


@trace
def langchain_run(func: Callable[[Any, str], str]) -> Callable:
    """
    Useful to override the default behavior of the LangChain object instantiated with @langchain_factory.
    Use when your agent run method has custom parameters.
    Takes the LangChain agent and the user input as parameters.
    The response will NOT be automatically sent to the UI, you need to call send_message.
    Args:
        func (Callable[[Any, str], str]): The function to be called when a new message is received. Takes the agent and user input as parameters and returns the output string.

    Returns:
        Callable[[Any, str], Any]: The decorated function.
    """

    config.lc_run = wrap_user_function(func)
    return func


@trace
def langchain_rename(func: Callable[[str], str]) -> Callable[[str], str]:
    """
    Useful to rename the LangChain tools/chains used in the agent and display more friendly author names in the UI.
    Args:
        func (Callable[[str], str]): The function to be called to rename a tool/chain. Takes the original tool/chain name as parameter.

    Returns:
        Callable[[Any, str], Any]: The decorated function.
    """

    config.lc_rename = wrap_user_function(func)
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

    config.on_chat_start = wrap_user_function(func, with_task=True)
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

    config.on_stop = wrap_user_function(func)
    return func


def action_callback(name: str) -> Callable:
    """
    Callback to call when an action is clicked in the UI.

    Args:
        func (Callable[[Action], Any]): The action callback to exexute. First parameter is the action.
    """

    def decorator(func: Callable[[Action], Any]):
        config.action_callbacks[name] = wrap_user_function(func, with_task=True)
        return func

    return decorator


def sleep(duration: int):
    """
    Sleep for a given duration.
    Args:
        duration (int): The duration in seconds.
    """
    return socketio.sleep(duration)


__all__ = [
    "user_session",
    "Action",
    "LocalImage",
    "RemoteImage",
    "Text",
    "send_message",
    "send_error_message",
    "ask_for_input",
    "ask_for_file",
    "start_stream",
    "send_token",
    "langchain_factory",
    "langchain_postprocess",
    "langchain_run",
    "langchain_rename",
    "on_chat_start",
    "on_stop",
    "action",
    "sleep",
]
