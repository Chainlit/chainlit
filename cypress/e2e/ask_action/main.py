from chainlit import Action, AskActionMessage, on_chat_start


@on_chat_start
async def main():
    res = await AskActionMessage(
        content="What do you in your free time?",
        actions=[
            Action(name="learn_python", value="learn_python", label="Learn Python"),
            Action(
                name="new_projects", value="new_projects", label="Create new projects"
            ),
        ],
        timeout=600,
        disable_feedback=True,
        include_content=True,
    ).send()

    if res:
        await AskActionMessage(
            content="What do you in your free time?",
            actions=[
                Action(name="learn_python", value="learn_python", label="Learn Python"),
                Action(
                    name="new_projects",
                    value="new_projects",
                    label="Create new projects",
                ),
            ],
            timeout=600,
            disable_feedback=True,
        ).send()
