import os
from chainlit.config import config
from chainlit.logger import logger


# Check if LangChain is installed and set up cache and callback handler
def patch():
    try:
        import langchain
        from langchain.cache import SQLiteCache

        if config.lc_cache_path:
            langchain.llm_cache = SQLiteCache(database_path=config.lc_cache_path)
            if not os.path.exists(config.lc_cache_path):
                logger.info(f"LangChain cache enabled: {config.lc_cache_path}")

        # New callback handler architecture
        if langchain.__version__ > "0.0.153":
            import chainlit.lc.new_monkey
        # Old callback handler architecture
        else:
            import chainlit.lc.old_monkey

        LANGCHAIN_INSTALLED = True
    except ImportError:
        LANGCHAIN_INSTALLED = False

    return LANGCHAIN_INSTALLED
