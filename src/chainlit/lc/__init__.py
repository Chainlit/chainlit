try:
    import langchain

    if langchain.__version__ < "0.0.189":
        raise ImportError(
            "LangChain version is too old, expected >= 0.0.189. Run `pip install langchain --upgrade`"
        )

    LANGCHAIN_INSTALLED = True
except ImportError:
    LANGCHAIN_INSTALLED = False
