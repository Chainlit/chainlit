import chainlit as cl

commands = [
    {"id": "Picture", "icon": "image", "description": "Use DALL-E"},
    {"id": "Search", "icon": "globe", "description": "Find on the web", "button": True},
    {
        "id": "Canvas",
        "icon": "pen-line",
        "description": "Collaborate on writing and code",
    },
    {
        "id": "Sticky",
        "icon": "pin",
        "description": "Persistent tool stays selected",
        "persistent": True,
    },
    {
        "id": "StickyButton",
        "icon": "bookmark",
        "description": "Persistent button tool",
        "button": True,
        "persistent": True,
    },
]


@cl.on_chat_start
async def start():
    await cl.context.emitter.set_commands(commands)


@cl.on_message
async def message(msg: cl.Message):
    # Clear all commands after choosing Picture to test UI behavior with zero commands
    # This simulates a scenario where certain commands might change the available tool set
    if msg.command == "Picture":
        await cl.context.emitter.set_commands([])

    await cl.Message(content=f"Command: {msg.command}").send()
