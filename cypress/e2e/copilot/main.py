import chainlit as cl


@cl.on_chat_start
async def on_chat_start():
    await cl.Message(content="Hi from copilot!").send()


@cl.on_message
async def on_message(msg: cl.Message):
    if cl.context.session.client_type == "copilot":
        fn = cl.CopilotFunction(name="test", args={"msg": msg.content})
        res = await fn.acall()
        await cl.Message(content=res).send()


@cl.on_copilot_event
async def on_copilot_event(data):
    await cl.Message(content=f"Event received: {data}").send()
