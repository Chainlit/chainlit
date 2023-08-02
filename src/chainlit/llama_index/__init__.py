try:
    import llama_index

    if llama_index.__version__ < "0.6.27":
        raise ValueError(
            "LlamaIndex version is too old, expected >= 0.6.27. Run `pip install llama_index --upgrade`"
        )

    LLAMA_INDEX_INSTALLED = True
except ImportError:
    LLAMA_INDEX_INSTALLED = False
