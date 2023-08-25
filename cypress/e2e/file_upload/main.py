import chainlit as cl


@cl.on_file_upload(accept={"text/plain": [".py"]})
async def upload_file(files: any):
    for file_data in files:
        await cl.Message(
            content=f"`{file_data['name']}` uploaded, it contains {len(file_data['content'])} characters!"
        ).send()


@cl.on_chat_start
async def start():
    await cl.Message(content=f"Try to upload a file").send()
