# This is a simple example of a chainlit app.

import chainlit as cl


@cl.on_chat_start
async def main():
    elements = [
        cl.Container(
            content=[
                cl.TextInput(key="FirstName", label="First Name"),
                cl.TextInput(key="LastName", label="Last Name"),
                cl.NumberInput(key="Age", label="Age"),
                cl.Radio(
                    key="Gender",
                    label="Gender",
                    options=["Male", "Female", "Other"],
                    initial_index=0,
                ),
                cl.SelectBox(
                    key="Country",
                    label="Country",
                    options=["US", "UK", "France", "Belgium", "Other"],
                    initial_index=2,
                ),
                cl.TextInput(key="Feedback", label="Feedback"),
                cl.Checkbox(key="Love", label="Are you loving chainlit?"),
                cl.Slider(
                    key="Score", label="How much?", initial=5, min=0, max=10, step=1
                ),
            ],
            name="feedback",
            display="side",
        ),
    ]

    res = await cl.Message(
        content="How are you liking chainlit? feedback", elements=elements
    ).send()
    res = await cl.AskUserMessage(
        content="Send something after filling in the feedback?", timeout=30
    ).send()

    if res:
        settings = cl.user_session.get("settings")
        await cl.Message(
            content=f"Thank you for providing feedback {settings['FirstName']} {settings['LastName']}"
        ).send()
        await cl.Message(
            content=f"Your information:\nAge: {settings['FirstName']}, Gender: {settings['Gender']}, Country: {settings['Country']}"
        ).send()
        await cl.Message(
            content=f"Feedback: {settings['Feedback']}\nScore: {settings['Score']}"
        ).send()

        if settings["Love"]:
            await cl.Message(content=f"I'm glad that you are enjoying chainlit!").send()
