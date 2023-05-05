import chainlit as cl


@cl.on_chat_start
def init():
    file = None

    # Wait for the user to upload a file
    print("Waiting for user to upload a file...")
    while file == None:
        file = cl.ask_for_file(
            title="Please upload a text file to begin!", accept=["text/plain"]
        )
    print("Got file!", file.name)
    # Decode the file
    text = file.content.decode("utf-8")
    print(text)

    # Let the user know that the system is ready
    cl.send_message(f"`{file.name}` uploaded, it contains {len(text)} characters!")
