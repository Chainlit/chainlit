from rush.sdk import Rush, LLMSettings
from rush.server import socketio

sdk = Rush(socketio.emit)

send_message = sdk.send_message
send_local_image = sdk.send_local_image
send_text_document = sdk.send_text_document
update_token_count = sdk.update_token_count
callback_manager = sdk.callback_manager