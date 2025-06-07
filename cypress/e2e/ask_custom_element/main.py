import chainlit as cl

@cl.on_chat_start
async def on_start():
    element = cl.CustomElement(name="AskForm", display="inline", props={"value": ""})
    res = await cl.AskElementMessage(
        content="Please fill the form:",
        element=element,
        timeout=10
    ).send()
    if res:
        await cl.Message(content=f"You entered: {res['value']}").send()
