from chainlit.sdk import Chainlit, LLMSettings
from chainlit.server import socketio

sdk = Chainlit(socketio.emit)

send_message = sdk.send_message
send_local_image = sdk.send_local_image
send_text_document = sdk.send_text_document
update_token_count = sdk.update_token_count
callback_manager = sdk.callback_manager