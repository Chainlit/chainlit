import chainlit as cl

@cl.on_chat_start
async def on_start():
    element = cl.CustomElement(
        name="JiraTicket",
        display="inline",
        props={"summary": "", "description": "", "priority": "Medium"}
    )
    res = await cl.AskElementMessage(
        content="Create a new Jira ticket:",
        element=element,
        timeout=10
    ).send()
    if res:
        await cl.Message(
            content=f"Ticket '{res['summary']}' with priority {res['priority']} submitted"
        ).send()
