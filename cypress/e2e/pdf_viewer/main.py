import os

import chainlit as cl

current_directory = os.path.dirname(os.path.abspath(__file__))
pdf_path = os.path.join(current_directory, "dummy.pdf")


@cl.on_chat_start
async def start():
    # Inline PDF: renders as a clickable thumbnail
    await cl.Message(
        content="Inline PDF below.",
        elements=[cl.Pdfjs(path=pdf_path, name="inline_pdf", display="inline")],
    ).send()

    # Side PDF: should auto-open the side panel
    await cl.Message(
        content="Side PDF - panel should open automatically.",
        elements=[cl.Pdfjs(path=pdf_path, name="side_pdf", display="side")],
    ).send()
