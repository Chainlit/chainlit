import aiofiles
import chainlit as cl


@cl.on_chat_start
async def start():
    files = await cl.AskFileMessage(
        content="Please upload a text file to begin!", accept=["text/plain"]
    ).send()
    txt_file = files[0]

    async with aiofiles.open(txt_file.path, encoding="utf-8") as f:
        content = await f.read()
        await cl.Message(
            content=f"`Text file {txt_file.name}` uploaded, it contains {len(content)} characters!"
        ).send()

    files = await cl.AskFileMessage(
        content="Please upload a python file to begin!",
        accept={
            "text/plain": [".py", ".txt"],
            # Some browser / os report it as text/plain but some as text/x-python when doing drag&drop
            "text/x-python": [".py"],
            # Or even as application/octet-stream when using the select file dialog
            "application/octet-stream": [".py"],
        },
    ).send()
    py_file = files[0]

    async with aiofiles.open(py_file.path, encoding="utf-8") as f:
        content = await f.read()
        await cl.Message(
            content=f"`Python file {py_file.name}` uploaded, it contains {len(content)} characters!"
        ).send()
