import os

from chainlit.config import config
from chainlit.logger import logger
from chainlit.lc import LANGCHAIN_INSTALLED


def init_lc_cache():
    use_cache = config.run.no_cache is False and config.run.ci is False

    if LANGCHAIN_INSTALLED and use_cache:
        import langchain
        from langchain.cache import SQLiteCache

        if config.project.lc_cache_path is None:
            langchain.llm_cache = SQLiteCache(
                database_path=config.project.lc_cache_path
            )
            if not os.path.exists(config.project.lc_cache_path):
                logger.info(
                    f"LangChain cache created at: {config.project.lc_cache_path}"
                )
