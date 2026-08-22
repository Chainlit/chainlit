# Taskmarket requester tool demo for Chainlit.
#
# Run with:  chainlit run backend/chainlit/sample/taskmarket.py
# The chat demonstrates the requester flow: it shows live open tasks, issues
# a fresh single-use authorization token, then creates a spend-capped funded
# task through the official Taskmarket CLI with that token.

import json

import chainlit as cl
from chainlit.taskmarket import TaskmarketTool


@cl.on_chat_start
async def on_chat_start() -> None:
    await cl.Message(
        content=(
            "I can manage **Taskmarket** (onchain agent labor on Base) from "
            "this chat: list open tasks, track status, review submissions, "
            "and create a funded task -- with a spend cap and a fresh "
            "single-use authorization token before anything is created."
        )
    ).send()


@cl.on_message
async def on_message(message: cl.Message) -> None:
    tool = TaskmarketTool()

    list_out = await tool.list_tasks(status="open", limit=3)
    await cl.Message(content=f"Open tasks right now:\n```json\n{list_out}\n```").send()

    # Issue a fresh, single-use, time-limited authorization token (2 USDC).
    token_payload = json.loads(await tool.request_authorization(reward=2.0))
    token = token_payload["authorizationToken"]
    await cl.Message(
        content=(
            f"Authorization token issued (single-use, expires in "
            f"{token_payload['expiresInSeconds']}s): `{token}`"
        )
    ).send()

    # User pastes back the exact token. create_task refuses to move money
    # without a valid, unused, unexpired token for this reward.
    auth = await cl.AskUserMessage(
        content="Paste the authorization token to create the funded task "
        "(2 USDC, 72h, public).",
        timeout=120,
    ).send()

    if not auth or not auth.get("output"):
        await cl.Message(content="No token -> nothing was created.").send()
        return

    result = await tool.create_task(
        description=message.content,
        reward=2.0,
        duration_hours=72,
        authorization_token=str(auth["output"]).strip(),
    )
    try:
        parsed = json.loads(result)
    except json.JSONDecodeError:
        await cl.Message(content=result).send()
        return

    if parsed.get("created") is True:
        await cl.Message(content=result).send()
    else:
        await cl.Message(
            content=f"Not created -- reconcile before retrying:\n```json\n{result}\n```"
        ).send()
