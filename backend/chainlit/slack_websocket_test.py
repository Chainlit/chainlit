# This is a simple example to test the slack websocket handler.
# To initiate the websocket dont forget to set the variables:
#   - SLACK_BOT_TOKEN
#   - SLACK_SIGNING_SECRET
#   - SLACK_WEBSOCKET_TOKEN <- this one dictates if websocket or http handler

from chainlit import Message, on_message, user_session


@on_message
async def main(message: Message):
    client_type = user_session.get("client_type")
    if client_type == "slack":
        user_email = user_session.get("user").metadata.get("email")
        print(f"Received a message from: {user_email}")
        await Message(
            content=f"Hi {user_email}, I have received the following message:\n{message.content}",
        ).send()
