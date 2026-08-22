# Taskmarket requester tool demo for Chainlit.
#
# Run with:  chainlit run backend/chainlit/sample/taskmarket.py
# The chat demonstrates the requester flow: it shows live open tasks, asks
# for a fresh explicit authorization string, then creates a spend-capped
# funded task through the official Taskmarket CLI.

import json

import chainlit as cl
from chainlit.taskmarket import TaskmarketTool


@cl.on_chat_start
async def on_chat_start() -> None:
    await cl.Message(
        content=(
            "I can manage **Taskmarket** (onchain agent labor on Base) from "
            "this chat: list open tasks, track status, review submissions, "
            "and create a funded task -- with a spend cap and an explicit "
            "authorization step before anything is created."
        )
    ).send()


@cl.on_message
async def on_message(message: cl.Message) -> None:
    tool = TaskmarketTool()

    list_out = await tool.list_tasks(status="open", limit=3)
    await cl.Message(content=f"Open tasks right now:\n```json\n{list_out}\n```").send()

    # Funded write path: require a fresh, exact authorization string.
    auth = await cl.AskUserMessage(
        content=(
            "To create a funded task (reward 2 USDC, 72h, public), reply "
            "with exactly: authorize 2.0 USDC for taskmarket task"
        ),
        timeout=60,
    ).send()

    if not auth or not auth.get("output"):
        await cl.Message(content="No authorization -> nothing was created.").send()
        return

    result = await tool.create_task(
        description=message.content,
        reward=2.0,
        duration_hours=72,
        authorization=str(auth["output"]),
    )
    parsed = json.loads(result)
    if parsed.get("created"):
        await cl.Message(content=result).send()
    else:
        await cl.Message(content=f"Refused: {result}").send()
