try:
    import langchain

    if langchain.__version__ < "0.0.198":
        raise ValueError(
            "LangChain version is too old, expected >= 0.0.198. Run `pip install langchain --upgrade`"
        )

    LANGCHAIN_INSTALLED = True
except ImportError:
    LANGCHAIN_INSTALLED = False

from chainlit.telemetry import trace
from typing import Callable, Any

from chainlit.config import config
from chainlit.utils import wrap_user_function


@trace
def langchain_factory(use_async: bool) -> Callable:
    """
    Plug and play decorator for the LangChain library.
    The decorated function should instantiate a new LangChain instance (Chain, Agent...).
    One instance per user session is created and cached.
    The per user instance is called every time a new message is received.

    Args:
        use_async bool: Whether to call the the agent asynchronously or not.

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
