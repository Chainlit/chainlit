try:
    import slack_bolt
except ModuleNotFoundError:
    raise ValueError(
        "The slack_bolt package is required to integrate Chainlit with a Slack app. Run `pip install slack_bolt --upgrade`"
    )
