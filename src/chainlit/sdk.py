from typing import Union, Optional
import os
from chainlit.session import Session
from chainlit.types import DocumentDisplay, LLMSettings, DocumentType
from chainlit.client import BaseClient
import inspect


class Chainlit:
    session: Optional[Session]

    def __init__(self, session: Session = None) -> None:
        """Initialize Chainlit with an optional session."""
        self.session = session

    def _get_session_property(self, property_name: str):
        """Helper method to get a property from the session."""
        if not hasattr(self, "session") or property_name not in self.session:
            return None
        return self.session[property_name]

    @property
    def emit(self):
        """Get the 'emit' property from the session."""
        return self._get_session_property("emit")

    @property
    def prompt(self):
        """Get the 'prompt' property from the session."""
        return self._get_session_property("prompt")

    @property
    def client(self) -> Union[BaseClient, None]:
        """Get the 'client' property from the session."""
        return self._get_session_property("client")

    @property
    def conversation_id(self):
        """Get the 'conversation_id' property from the session."""
        return self._get_session_property("conversation_id")

    def send_document(self, ext: str, content: bytes, name: str, type: DocumentType, display: DocumentDisplay):
        """Send a document to the client."""
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
        if self.emit:
            self.emit('document', document)

    def send_local_image(self, path: str, name: str, display: DocumentDisplay = "side"):
        """Send a local image to the client."""
        if not self.emit:
            return

        with open(path, 'rb') as f:
            _, ext = os.path.splitext(path)
            type = "image"
            image_data = f.read()
            self.send_document(ext, image_data, name, type, display)

    def send_text_document(self, text: str, name: str, display: DocumentDisplay = "side"):
        """Send a text document to the client."""
        if not self.emit:
            return

        type = "text"
        ext = ".txt"
        self.send_document(ext, bytes(text, "utf-8"), name, type, display)

    def send_message(self, author: str, content: str, prompt: str = None, language: str = None, indent=0, is_error=False, final=False, llm_settings: LLMSettings = None):
        """Send a message to the client."""
        if not self.emit:
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

    def send_prompt_timeout(self, author: str):
        """Send a prompt timeout message to the client."""
        self.send_message(
            author=author, content="Prompt timed out", is_error=True, final=True)

        if self.emit:
            self.emit("prompt_timeout", {})

    def send_prompt(self, author: str, content: str, timeout=60):
        """Send a prompt to the client and wait for a response."""
        if not self.prompt:
            return

        msg = {
            "conversationId": self.conversation_id,
            "author": author,
            "content": content,
            "waitForAnswer": True,
            "final": True
        }

        if self.client and self.conversation_id:
            message_id = self.client.create_message(msg)
            msg["id"] = message_id

        try:
            res = self.prompt({"msg": msg, "timeout": timeout}, timeout)

            if self.client and self.conversation_id:
                res_msg = {
                    "conversationId": self.conversation_id,
                    "author": res["author"],
                    "content": res["content"],
                    "final": True

                }
                self.client.create_message(res_msg)

                return res
        except TimeoutError as e:
            self.send_prompt_timeout(author)
            raise e

    def update_token_count(self, count: int):
        """Update the token count for the client."""
        if not self.emit:
            return
        self.emit("token_usage", count)


def get_sdk() -> Union[Chainlit, None]:
    """Get the Chainlit SDK instance from the current call stack."""
    attr = "__chainlit_sdk__"
    candidates = [i[0].f_locals.get(attr) for i in inspect.stack()]
    sdk = None
    for candidate in candidates:
        if candidate:
            sdk = candidate
            break
    return sdk
