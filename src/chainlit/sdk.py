from typing import Union, Optional
import os
# from langchain.callbacks.base import CallbackManager
# from langchain.callbacks import OpenAICallbackHandler
# from chainlit.uihandler import UiCallbackHandler
from chainlit.session import Session
from chainlit.types import DocumentDisplay, LLMSettings, DocumentType
from chainlit.client import BaseClient

class Chainlit:
    session: Optional[Session]

    def __init__(self, session: Session = None) -> None:
        self.session = session

    @property
    def emit(self):
        if not hasattr(self, "session") or "emit" not in self.session:
            return None
        return self.session["emit"]

    @property
    def client(self) -> Union[BaseClient, None]:
        if not hasattr(self, "session") or "client" not in self.session:
            return None
        return self.session["client"]

    @property
    def conversation_id(self):
        if not hasattr(self, "session") or "conversation_id" not in self.session:
            return None
        return self.session["conversation_id"]

    # def callback_manager(self, handlers=None):
    #     if self.emit is not None:
    #         return CallbackManager(
    #             [UiCallbackHandler(sdk=self), OpenAICallbackHandler()])
    #     else:
    #         if handlers is None:
    #             return None
    #         else:
    #             return CallbackManager(handlers)

    def send_document(self, ext: str, content: bytes, name: str, type: DocumentType, display: DocumentDisplay):
        if self.client and self.conversation_id:
            url = self.client.upload_document(ext=ext, content=content)
            document = self.client.create_document(
                conversation_id=self.conversation_id, name=name, url=url, type=type, display=display)
        else:
            document = {
                "name": name,
                "content": content.decode("utf-8") if type == "text" else content,
                "type": type,
                "display": display,
            }
        self.emit('document', document)

    def send_local_image(self, path: str, name: str, display: DocumentDisplay = "side"):
        if self.emit is None:
            return
        with open(path, 'rb') as f:
            _, ext = os.path.splitext(path)
            type = "image"
            image_data = f.read()
            self.send_document(ext, image_data, name, type, display)

    def send_text_document(self, text: str, name: str, display: DocumentDisplay = "side"):
        if self.emit is None:
            return
        type = "text"
        ext = ".txt"
        self.send_document(ext, bytes(text, "utf-8"), name, type, display)

    def send_message(self, author: str, content: str, prompt: str = None, language: str = None, indent=0, is_error=False, final=False, llm_settings: LLMSettings = None):
        if self.emit is None:
            return

        if llm_settings is None and prompt is not None:
            llm_settings = LLMSettings()

        if llm_settings:
            llm_settings = llm_settings.to_dict()

        msg = {
            "conversationId": self.conversation_id,
            "author": author,
            "content": content,
            "indent": indent,
            "language": language,
            "isError": is_error,
            "prompt": prompt,
            "llmSettings": llm_settings,
            "final": final,
        }
        if self.client and self.conversation_id:
            message_id = self.client.create_message(msg)
            msg["id"] = message_id
        self.emit("message", msg)

    def update_token_count(self, count: int):
        if self.emit is None:
            return
        self.emit("total_tokens", count)
