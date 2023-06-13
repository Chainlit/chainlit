import os

from chainlit.config import config
from chainlit.logger import logger
from chainlit.lc import LANGCHAIN_INSTALLED


def init_lc_cache():
    use_cache = (
        config.run_settings.no_cache is False and config.run_settings.ci is False
    )

    if LANGCHAIN_INSTALLED and use_cache:
        import langchain
        from langchain.cache import SQLiteCache

        if config.lc_cache_path:
            langchain.llm_cache = SQLiteCache(database_path=config.lc_cache_path)
            if not os.path.exists(config.lc_cache_path):
                logger.info(f"LangChain cache enabled: {config.lc_cache_path}")
