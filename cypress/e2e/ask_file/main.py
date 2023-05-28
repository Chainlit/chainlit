import chainlit as cl


@cl.on_chat_start
def start():
    file = None

    # Wait for the user to upload a file
    while file == None:
        file = cl.AskFileMessage(
            content="Please upload a text file to begin!", accept=["text/plain"]
        ).send()
    # Decode the file
    text = file.content.decode("utf-8")

    # Let the user know that the system is ready
    cl.Message(
        content=f"`{file.name}` uploaded, it contains {len(text)} characters!"
    ).send()
