try:
    import langchain

    if langchain.__version__ < "0.0.198":
        raise ValueError(
            "LangChain version is too old, expected >= 0.0.198. Run `pip install langchain --upgrade`"
        )

    LANGCHAIN_INSTALLED = True
except ImportError:
    LANGCHAIN_INSTALLED = False
