import inspect
from typing import Callable, Any
from chainlit.types import DocumentDisplay, LLMSettings


def wrap_user_function(user_function):
    def wrapper(*args):
        # Get the parameter names of the user-defined function
        user_function_params = list(
            inspect.signature(user_function).parameters.keys())

        # Create a dictionary of parameter names and their corresponding values from *args
        params_values = {param_name: arg for param_name,
                         arg in zip(user_function_params, args)}

        # Call the user-defined function with the arguments
        return user_function(**params_values)
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


def send_message(author: str, content: str, prompt: str = None, language: str = None, indent=0, is_error=False, final=False, llm_settings: LLMSettings = None):
    """
    Send a message to the chatbot UI.
    If a project ID is configured, the messages will be uploaded to the cloud storage.

    Args:
        author (str): The author of the message, this will be used in the UI.
        content (str): The content of the message.
        prompt (str, optional): The prompt used to generate the message. If provided, enables the prompt playground for this message.
        language (str, optional): Language of the code is the content is code. See https://react-code-blocks-rajinwonderland.vercel.app/?path=/story/codeblock--supported-languages for a list of supported languages.
        indent (int, optional): Number of indents to add to the message in the UI.
        is_error (bool, optional): Whether the message indicates an error.
        final (bool, optional): Whether the message is the final answer (vs a chain of thought step).
        llm_settings (LLMSettings, optional): Settings of the LLM used to generate the prompt. This is useful for debug purposes in the prompt playground.
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        sdk.send_message(author, content, prompt, language,
                         indent, is_error, final, llm_settings)


def send_prompt(author: str, content: str, timeout=60):
    """
    Send a question to the chatbot UI that the user must answer before continuing.
    Not to be confused with LLMs prompts.
    If the user does not answer in time (see timeout), a TimeoutError is raised and a message indicating the timeout is sent.
    If a project ID is configured, the messages will be uploaded to the cloud storage.

    Args:
        author (str): The author of the prompt, this will be used in the UI.
        content (str): The content of the prompt.
        timeout (int, optional): The number of seconds to wait for an answer before raising a TimeoutError.

    Returns:
        PromptResponse: The response from the user include "msg" and "author".
    """
    from chainlit.sdk import get_sdk
    sdk = get_sdk()
    if sdk:
        return sdk.send_prompt(author=author, content=content, timeout=timeout)


def langchain_factory(func):
    """
    Plug and play decorator for the LangChain library.
    The decorated function should instantiate a new LangChain instance (Chain, Agent...).
    One instance per user session is created and cached.
    The per user instance is called every time a new message is received.

    Args:
        func (Callable[[Dict[str, str]], Any]): The factory function to create a new LangChain instance. Takes the user env as parameter.

    Returns:
        Callable[[Dict[str, str]], Any]: The decorated factory function.
    """
    from chainlit.config import config
    config.lc_factory = wrap_user_function(func)
    return func


def langchain_postprocess(func: Callable[[Any], str]):
    """
    Useful to post process the response a LangChain object instantiated with @langchain_factory.
    The decorated function takes the raw output of the LangChain object and return a string as the final response.

    Args:
        func (Callable[[Any, Dict[str, str]], str]): The post-processing function to apply after generating a response. Takes the response and the user env as parameters.

    Returns:
        Callable[[Any, Dict[str, str]], str]: The decorated post-processing function.
    """
    from chainlit.config import config
    config.lc_postprocess = wrap_user_function(func)
    return func


def on_message(func):
    """
    Framework agnostic decorator to react to messages coming from the UI.
    The decorated function is called every time a new message is received.

    Args:
        func (Callable[[str, Dict[str, str]], Any]): The function to be called when a new message is received. Takes the input message and the user env as parameters.

    Returns:
        Callable[[str, Dict[str, str]], Any]: The decorated on_message function.
    """
    from chainlit.config import config
    config.on_message = wrap_user_function(func)
    return func


def on_stop(func):
    """
    Hook to react to the user stopping a conversation.

    Args:
        func (Callable[[Dict[str, str]], Any]): The stop hook to execute. Takes the user env as parameter.

    Returns:
        Callable[[Dict[str, str]], Any]: The decorated stop hook.
    """
    from chainlit.config import config
    config.on_stop = wrap_user_function(func)
    return func
