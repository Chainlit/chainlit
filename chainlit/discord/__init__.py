try:
    import discord
except ModuleNotFoundError:
    raise ValueError(
        "The discord package is required to integrate Chainlit with a Slack app. Run `pip install discord --upgrade`"
    )
