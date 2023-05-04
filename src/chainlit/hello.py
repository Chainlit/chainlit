# This is a simple example of a chainlit script.

from chainlit import send_message, ask_for_input, on_chat_start


@on_chat_start
def main():
    res = ask_for_input(content="What is your name?", timeout=30)
    if res:
        send_message(
            content=f"Your name is: {res['content']}.\nChainlit installation is working!",
        )
