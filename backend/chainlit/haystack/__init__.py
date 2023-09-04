from chainlit.utils import check_module_version

if not check_module_version("haystack", "1.18.0"):
    raise ValueError(
        "Expected Haystack version >= 1.18.0. Run `pip install farm-haystack --upgrade`"
    )
