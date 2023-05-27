# This is a simple example of a chainlit app.

from chainlit import AskUser, Message, on_chat_start


@on_chat_start
def main():
    res = AskUser(content="What is your name?", timeout=30).send()
    if res:
        Message(
            content=f"Your name is: {res['content']}.\nChainlit installation is working!\nYou can now start building your own chainlit apps!",
        ).send()
