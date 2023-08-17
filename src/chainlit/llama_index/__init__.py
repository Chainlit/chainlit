try:
    import llama_index

    if llama_index.__version__ < "0.8.3":
        raise ValueError(
            "LlamaIndex version is too old, expected >= 0.8.3. Run `pip install llama_index --upgrade`"
        )

    LLAMA_INDEX_INSTALLED = True
except ImportError:
    LLAMA_INDEX_INSTALLED = False
