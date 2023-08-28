from chainlit.utils import check_module_version

if not check_module_version("langchain", "0.0.198"):
    raise ValueError(
        "LangChain version is too old, expected >= 0.0.198. Run `pip install langchain --upgrade`"
    )
