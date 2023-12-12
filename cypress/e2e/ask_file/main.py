import aiofiles

import chainlit as cl


@cl.on_chat_start
async def start():
    files = await cl.AskFileMessage(
        content="Please upload a text file to begin!", accept=["text/plain"]
    ).send()
    txt_file = files[0]

    async with aiofiles.open(txt_file.path, "r", encoding="utf-8") as f:
        content = await f.read()
        await cl.Message(
            content=f"`Text file {txt_file.name}` uploaded, it contains {len(content)} characters!"
        ).send()

    files = await cl.AskFileMessage(
        content="Please upload a python file to begin!", accept={"text/plain": [".py"]}
    ).send()
    py_file = files[0]

    async with aiofiles.open(py_file.path, "r", encoding="utf-8") as f:
        content = await f.read()
        await cl.Message(
            content=f"`Python file {py_file.name}` uploaded, it contains {len(content)} characters!"
        ).send()
