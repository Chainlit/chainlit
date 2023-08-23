try:
    import haystack

    if haystack.__version__ < "1.18.0":
        raise ValueError(
            "Haystack version is too old, expected >= 1.18.0. Run `pip install farm-haystack --upgrade`"
        )

    HAYSTACK_INSTALLED = True
except ImportError:
    HAYSTACK_INSTALLED = False
