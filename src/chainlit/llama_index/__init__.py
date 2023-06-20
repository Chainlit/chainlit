try:
    import llama_index

    if llama_index.__version__ < "0.6.27":
        raise ValueError(
            "LlamaIndex version is too old, expected >= 0.6.27. Run `pip install llama_index --upgrade`"
        )

    LLAMA_INDEX_INSTALLED = True
except ImportError:
    LLAMA_INDEX_INSTALLED = False


from chainlit.telemetry import trace
from typing import Callable

from chainlit.config import config
from chainlit.utils import wrap_user_function


@trace
def llama_index_factory(func: Callable) -> Callable:
    """
    Plug and play decorator for the Llama Index library.
    The decorated function should instantiate a new Llama instance.
    One instance per user session is created and cached.
    The per user instance is called every time a new message is received.

    Returns:
        Callable[[], Any]: The decorated factory function.
    """

    config.code.llama_index_factory = wrap_user_function(func, with_task=True)
    return func
