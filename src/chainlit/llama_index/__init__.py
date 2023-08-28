from chainlit.utils import check_module_version

if not check_module_version("llama_index", "0.8.3"):
    raise ValueError(
        "LlamaIndex version is too old, expected >= 0.8.3. Run `pip install llama_index --upgrade`"
    )
