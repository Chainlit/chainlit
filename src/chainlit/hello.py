from chainlit import send_message, ask_user, on_chat_start

bot_name = "Hello bot"


@on_chat_start
def main(env):
    res = ask_user(author=bot_name, content="What is your name?", timeout=30)
    if res:
        send_message(
            author=bot_name,
            content=f"Your name is: {res['content']}",
        )