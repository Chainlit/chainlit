try:
    import langflow

    if langflow.__version__ < "0.1.4":
        raise ValueError(
            "LlamaIndex version is too old, expected >= 0.1.4. Run `pip install langflow --upgrade`"
        )

    LANGFLOW_INSTALLED = True
except ImportError:
    LANGFLOW_INSTALLED = False

from typing import Callable, Union, Dict, Optional
import aiohttp

from chainlit.telemetry import trace
from chainlit.config import config
from chainlit.lc import langchain_factory


@trace
def langflow_factory(
    use_async: bool, schema: Union[Dict, str], tweaks: Optional[Dict] = None
) -> Callable:
    """
    Plug and play decorator for the Langflow library.
    One instance per user session is created and cached.
    The per user instance is called every time a new message is received.

    Args:
        use_async bool: Whether to call the the agent asynchronously or not.
        schema (Union[Dict, str]): The langflow schema dict or url.
        tweaks Optional[Dict]: Optional tweaks to be processed


    Returns:
        Callable[[], Any]: The decorated factory function.
    """

    # Check if the factory is called with the correct parameter
    if type(schema) not in [dict, str]:
        error_message = "langflow_factory schema parameter is required"
        raise ValueError(error_message)

    # Check if the factory is called with the correct parameter
    if type(use_async) != bool:
        error_message = "langflow_factory use_async parameter is required"
        raise ValueError(error_message)

    config.code.langflow_schema = schema

    def decorator(func: Callable) -> Callable:
        async def wrapper():
            from langflow import load_flow_from_json

            schema = config.code.langflow_schema

            if type(schema) == str:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        schema,
                    ) as r:
                        if not r.ok:
                            reason = await r.text()
                            raise ValueError(f"Error: {reason}")
                        schema = await r.json()

            flow = load_flow_from_json(input=schema, tweaks=tweaks)
            return func(flow)

        langchain_factory(use_async=use_async)(wrapper)

        return func

    return decorator
