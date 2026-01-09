import chainlit as cl


@cl.step(name="search", type="tool", icon="search")
async def search():
    await cl.sleep(1)
    return "Response from search"


@cl.step(name="database", type="tool", icon="database")
async def database():
    await cl.sleep(1)
    return "Response from database"


@cl.step(name="regular", type="tool")
async def regular():
    await cl.sleep(1)
    return "Response from regular"


async def cpu():
    async with cl.Step(name="cpu", type="tool", icon="cpu") as s:
        await cl.sleep(1)
        s.output = "Response from cpu"


@cl.on_message
async def main(message: cl.Message):
    await search()
    await database()
    await regular()
    await cpu()
