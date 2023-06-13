import chainlit as cl


@cl.on_chat_start
async def start():
    files = await cl.AskFileMessage(
        content="Please upload from one to two python files to begin!",
        max_files=2,
        accept={"text/plain": [".py"]},
    ).send()

    file_names = [file.name for file in files]

    await cl.Message(
        content=f"{len(files)} files uploaded: {','.join(file_names)}"
    ).send()
