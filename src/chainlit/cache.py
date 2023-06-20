import os
import threading

from chainlit.config import config
from chainlit.logger import logger
from chainlit.lc import LANGCHAIN_INSTALLED


def init_lc_cache():
    use_cache = config.run.no_cache is False and config.run.ci is False

    if LANGCHAIN_INSTALLED and use_cache:
        import langchain
        from langchain.cache import SQLiteCache

        if config.project.lc_cache_path is not None:
            langchain.llm_cache = SQLiteCache(
                database_path=config.project.lc_cache_path
            )
            if not os.path.exists(config.project.lc_cache_path):
                logger.info(
                    f"LangChain cache created at: {config.project.lc_cache_path}"
                )


_cache = {}
_cache_lock = threading.Lock()


def cache(func):
    def wrapper(*args, **kwargs):
        # Create a cache key based on the function name, arguments, and keyword arguments
        cache_key = (
            (func.__name__,) + args + tuple((k, v) for k, v in sorted(kwargs.items()))
        )

        with _cache_lock:
            # Check if the result is already in the cache
            if cache_key not in _cache:
                # If not, call the function and store the result in the cache
                _cache[cache_key] = func(*args, **kwargs)

        return _cache[cache_key]

    return wrapper
