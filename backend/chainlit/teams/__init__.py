try:
    import botbuilder
except ModuleNotFoundError:
    raise ValueError(
        "The botbuilder-core package is required to integrate Chainlit with a Slack app. Run `pip install botbuilder-core --upgrade`"
    )
