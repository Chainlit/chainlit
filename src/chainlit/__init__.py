import gevent
from gevent import monkey
monkey.patch_all()

import inspect
from typing import Callable, Any, List, Union
from chainlit.types import DocumentDisplay, LLMSettings, AskSpec, AskFileSpec, File, AskResponse
from chainlit.config import config
from chainlit.user_session import user_session

def wrap_user_function(user_function: Callable, with_task=False) -> Callable:
    """
    Wraps a user-defined function to accept arguments as a dictionary.

    Args:
        user_function (Callable): The user-defined function to wrap.

    Returns:
        Callable: The wrapped function.
    """

    def wrapper(*args):
        from chainlit.sdk import get_sdk
        sdk = get_sdk()
        # Get the parameter names of the user-defined function
        user_function_params = list(
            inspect.signature(user_function).parameters.keys())

        # Create a dictionary of parameter names and their corresponding values from *args
        params_values = {param_name: arg for param_name,
                         arg in zip(user_function_params, args)}

        if with_task and sdk:
            sdk.task_start()

        try:
            # Call the user-defined function with the arguments
            return user_function(**params_values)
        finally:
            if with_task and sdk:
                sdk.task_end()

    return wrapper


def send_text_document(text: str, name: str, display: DocumentDisplay = "side"):
    """
    Send a text document to the chatbot UI.
    If a project ID is configured, the document will be uploaded to the cloud storage.

    Args:
        text (str): The content of the text document.
        name (str): The name of the text document to be displayed in the UI.
        display (DocumentDisplay, optional): Determines how the document should be displayed in the UI.
            Choices are "side" (default) or "inline" or "page".
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        sdk.send_text_document(text, name, display)


def send_local_image(path: str, name: str, display: DocumentDisplay = "side"):
    """
    Send a local image to the chatbot UI.
    If a project ID is configured, the image will be uploaded to the cloud storage.

    Args:
        path (str): The local file path of the image.
        name (str): The name of the image to be displayed in the UI.
        display (DocumentDisplay, optional): Determines how the image should be displayed in the UI.
            Choices are "side" (default) or "inline" or "page".
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        sdk.send_local_image(path, name, display)


def send_message(content: str, author=config.chatbot_name, prompt: str = None, language: str = None, indent=0, llm_settings: LLMSettings = None, end_stream=False):
    """
    Send a message to the chatbot UI.
    If a project ID is configured, the messages will be uploaded to the cloud storage.

    Args:
        content (str): The content of the message.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        prompt (str, optional): The prompt used to generate the message. If provided, enables the prompt playground for this message.
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        indent (int, optional): If positive, the message will be nested in the UI.
        llm_settings (LLMSettings, optional): Settings of the LLM used to generate the prompt. This is useful for debug purposes in the prompt playground.
        end_stream (bool, optional): Pass True if this message was streamed.
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        sdk.send_message(author=author, content=content, prompt=prompt, language=language,
                         indent=indent, llm_settings=llm_settings, end_stream=end_stream)


def send_error_message(content: str, author=config.chatbot_name, indent=0):
    """
    Send an error message to the chatbot UI.
    If a project ID is configured, the messages will be uploaded to the cloud storage.

    Args:
        content (str): The content of the error.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        indent (int, optional): If positive, the message will be nested in the UI.
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        sdk.send_message(author=author, content=content,
                         is_error=True, indent=indent)


def ask_for_input(content: str, author=config.chatbot_name, timeout=60, raise_on_timeout=False) -> Union[AskResponse, None]:
    """
    Ask for the user input before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the messages will be uploaded to the cloud storage.

    Args:
        content (str): The content of the prompt.
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.
        raise_on_timeout (bool, optional): Whether to raise a socketio TimeoutError if the user does not answer in time.
    Returns:
        AskResponse: The response from the user include "msg" and "author" or None.
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        spec = AskSpec(type="text", timeout=timeout)
        return sdk.send_ask_user(author=author, content=content, spec=spec, raise_on_timeout=raise_on_timeout)


def ask_for_file(title: str, accept: List[str], max_size_mb=2, author=config.chatbot_name, timeout=90, raise_on_timeout=False) -> Union[File, None]:
    """
    Ask the user to upload a file before continuing.
    If the user does not answer in time (see timeout), a TimeoutError will be raised or None will be returned depending on raise_on_timeout.
    If a project ID is configured, the messages will be uploaded to the cloud storage.

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
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        spec = AskFileSpec(type="file", accept=accept,
                           max_size_mb=max_size_mb, timeout=timeout)
        res = sdk.send_ask_user(author=author, content=title, spec=spec, raise_on_timeout=raise_on_timeout)
        if res:
            return File(**res)
        else:
            return None


def start_stream(author=config.chatbot_name, indent: int = 0, language: str = None, llm_settings: LLMSettings = None):
    """
    Start a streamed message.

    Args:
        author (str, optional): The author of the message, this will be used in the UI. Defaults to the chatbot name (see config).
        indent (int, optional): If positive, the message will be nested in the UI.
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        llm_settings (LLMSettings, optional): Settings of the LLM used to generate the prompt. This is useful for debug purposes in the prompt playground.
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        return sdk.stream_start(author=author, indent=indent, language=language, llm_settings=llm_settings)


def send_token(token: str):
    """
    Start a token belonging to a message.

    Args:
        token (str): The token to send.
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        return sdk.send_token(token)


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
    from chainlit.config import config
    config.lc_factory = wrap_user_function(func, with_task=True)
    return func


def langchain_postprocess(func: Callable[[Any], str]) -> Callable:
    """
    Useful to post process the response a LangChain object instantiated with @langchain_factory.
    The decorated function takes the raw output of the LangChain object and return a string as the final response.

    Args:
        func (Callable[[Any], str]): The post-processing function to apply after generating a response. Takes the response as parameter.

    Returns:
        Callable[[Any], str]: The decorated post-processing function.
    """
    from chainlit.config import config
    config.lc_postprocess = wrap_user_function(func)
    return func


def on_message(func: Callable) -> Callable:
    """
    Framework agnostic decorator to react to messages coming from the UI.
    The decorated function is called every time a new message is received.

    Args:
        func (Callable[[str], Any]): The function to be called when a new message is received. Takes the input message.

    Returns:
        Callable[[str], Any]: The decorated on_message function.
    """
    from chainlit.config import config
    config.on_message = wrap_user_function(func)
    return func

def langchain_run(func: Callable) -> Callable:
    """
    Useful to override the default behavior of the LangChain object instantiated with @langchain_factory.
    Use when your agent run method has custom parameters.
    Args:
        func (Callable[[Any, str], Any]): The function to be called when a new message is received. Takes the agent and user input as parameters.

    Returns:
        Callable[[Any, str], Any]: The decorated function.
    """
    from chainlit.config import config
    config.lc_run = wrap_user_function(func)
    return func


def on_chat_start(func: Callable) -> Callable:
    """
    Hook to react to the user websocket connection event.

    Args:
        func (Callable[], Any]): The connection hook to execute.

    Returns:
        Callable[], Any]: The decorated hook.
    """
    from chainlit.config import config
    config.on_chat_start = wrap_user_function(func, with_task=True)
    return func


def on_stop(func: Callable) -> Callable:
    """
    Hook to react to the user stopping a conversation.

    Args:
        func (Callable[[], Any]): The stop hook to execute.

    Returns:
        Callable[[], Any]: The decorated stop hook.
    """
    from chainlit.config import config
    config.on_stop = wrap_user_function(func)
    return func
