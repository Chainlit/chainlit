from chainlit.utils import check_module_version

if not check_module_version("langchain_core", "0.2.5"):
    raise ValueError(
        "Expected langchain-core version >= 0.2.5. Run `pip install langchain-core --upgrade`"
    )
