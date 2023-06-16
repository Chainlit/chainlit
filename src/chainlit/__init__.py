from dotenv import load_dotenv
from typing import Callable, Any
import inspect
import os
import asyncio

from chainlit.lc import LANGCHAIN_INSTALLED
from chainlit.config import config
from chainlit.telemetry import trace
from chainlit.version import __version__
from chainlit.logger import logger
from chainlit.emitter import ChainlitEmitter
from chainlit.types import LLMSettings
from chainlit.message import ErrorMessage
from chainlit.action import Action
from chainlit.element import Image, Text, Pdf, Avatar, Pyplot
from chainlit.message import Message, ErrorMessage, AskUserMessage, AskFileMessage
from chainlit.user_session import user_session
from chainlit.sync import run_sync, make_async

if LANGCHAIN_INSTALLED:
    from chainlit.lc.callbacks import (
        ChainlitCallbackHandler,
        AsyncChainlitCallbackHandler,
    )


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

    async def wrapper(*args, __chainlit_emitter__: ChainlitEmitter):
        # Get the parameter names of the user-defined function
        user_function_params = list(inspect.signature(user_function).parameters.keys())

        # Create a dictionary of parameter names and their corresponding values from *args
        params_values = {
            param_name: arg for param_name, arg in zip(user_function_params, args)
        }

        if with_task:
            await __chainlit_emitter__.task_start()

        try:
            # Call the user-defined function with the arguments
            if inspect.iscoroutinefunction(user_function):
                return await user_function(**params_values)
            else:
                return user_function(**params_values)
        except InterruptedError:
            pass
        except Exception as e:
            logger.exception(e)
            await ErrorMessage(content=str(e), author="Error").send()
        finally:
            if with_task:
                await __chainlit_emitter__.task_end()

    return wrapper


@trace
def langchain_factory(use_async: bool) -> Callable:
    """
    Plug and play decorator for the LangChain library.
    The decorated function should instantiate a new LangChain instance (Chain, Agent...).
    One instance per user session is created and cached.
    The per user instance is called every time a new message is received.

    Args:
        use_async bool: Whether to call the the agent asynchronously or not. Defaults to False.

    Returns:
        Callable[[], Any]: The decorated factory function.
    """

    # Check if the factory is called with the correct parameter
    if type(use_async) != bool:
        error_message = "langchain_factory use_async parameter is required"
        raise ValueError(error_message)

    def decorator(func: Callable) -> Callable:
        config.code.lc_factory = wrap_user_function(func, with_task=True)
        return func

    config.code.lc_agent_is_async = use_async

    return decorator


@trace
def langchain_postprocess(func: Callable[[Any], str]) -> Callable:
    """
    Useful to post process the response a LangChain object instantiated with @langchain_factory.
    The decorated function takes the raw output of the LangChain object as input.
    The response will NOT be automatically sent to the UI, you need to send a Message.

    Args:
        func (Callable[[Any], str]): The post-processing function to apply after generating a response. Takes the response as parameter.

    Returns:
        Callable[[Any], str]: The decorated post-processing function.
    """

    config.code.lc_postprocess = wrap_user_function(func)
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

    config.code.on_message = wrap_user_function(func)
    return func


@trace
def langchain_run(func: Callable[[Any, str], str]) -> Callable:
    """
    Useful to override the default behavior of the LangChain object instantiated with @langchain_factory.
    Use when your agent run method has custom parameters.
    Takes the LangChain agent and the user input as parameters.
    The response will NOT be automatically sent to the UI, you need to send a Message.
    Args:
        func (Callable[[Any, str], str]): The function to be called when a new message is received. Takes the agent and user input as parameters and returns the output string.

    Returns:
        Callable[[Any, str], Any]: The decorated function.
    """
    config.code.lc_run = wrap_user_function(func)
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

    config.code.lc_rename = wrap_user_function(func)
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
        func (Callable[[Action], Any]): The action callback to exexute. First parameter is the action.
    """

    def decorator(func: Callable[[Action], Any]):
        config.code.action_callbacks[name] = wrap_user_function(func, with_task=True)
        return func

    return decorator


def sleep(duration: int):
    """
    Sleep for a given duration.
    Args:
        duration (int): The duration in seconds.
    """
    return asyncio.sleep(duration)


__all__ = [
    "user_session",
    "LLMSettings",
    "Action",
    "Pdf",
    "Image",
    "Text",
    "Avatar",
    "Pyplot",
    "Message",
    "ErrorMessage",
    "AskUserMessage",
    "AskFileMessage",
    "langchain_factory",
    "langchain_postprocess",
    "langchain_run",
    "langchain_rename",
    "on_chat_start",
    "on_stop",
    "action_callback",
    "sleep",
    "ChainlitCallbackHandler",
    "AsyncChainlitCallbackHandler",
    "run_sync",
    "make_async",
]
