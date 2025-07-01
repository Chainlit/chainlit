import chainlit as cl


@cl.on_chat_start
async def on_start():
    element = cl.CustomElement(
        name="JiraTicket",
        display="inline",
        props={
            "timeout": 20,
            "fields": [
                {"id": "summary", "label": "Summary", "type": "text", "required": True},
                {"id": "description", "label": "Description", "type": "textarea"},
                {
                    "id": "due",
                    "label": "Due Date",
                    "type": "date",
                },
                {
                    "id": "priority",
                    "label": "Priority",
                    "type": "select",
                    "options": ["Low", "Medium", "High"],
                    "value": "Medium",
                    "required": True,
                },
            ],
        },
    )
    res = await cl.AskElementMessage(
        content="Create a new Jira ticket:", element=element, timeout=10
    ).send()
    if res and res.get("submitted"):
        await cl.Message(
            content=f"Ticket '{res['summary']}' with priority {res['priority']} submitted"
        ).send()
