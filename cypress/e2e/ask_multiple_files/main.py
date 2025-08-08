import chainlit as cl


@cl.on_chat_start
async def start():
    files = await cl.AskFileMessage(
        content="Please upload from one to two python files to begin!",
        max_files=2,
        accept={
            "text/plain": [".py", ".txt"],
            # Some browser / os report it as text/plain but some as text/x-python when doing drag&drop
            "text/x-python": [".py"],
            # Or even as application/octet-stream when using the select file dialog
            "application/octet-stream": [".py"],
        },
    ).send()

    file_names = [file.name for file in files]

    await cl.Message(
        content=f"{len(files)} files uploaded: {','.join(file_names)}"
    ).send()
