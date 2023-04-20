from typing import Union, Optional
import os
from chainlit.session import Session
from chainlit.types import DocumentDisplay, LLMSettings, DocumentType, AskSpec
from chainlit.client import BaseClient
from socketio.exceptions import TimeoutError
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
    def ask_user(self):
        """Get the 'ask_user' property from the session."""
        return self._get_session_property("ask_user")

    @property
    def client(self) -> Union[BaseClient, None]:
        """Get the 'client' property from the session."""
        return self._get_session_property("client")

    def send_document(self, ext: str, content: bytes, name: str, type: DocumentType, display: DocumentDisplay):
        """Send a document to the client."""
        if self.client:
            url = self.client.upload_document(ext=ext, content=content)
            document = self.client.create_document(
                name=name, url=url, type=type, display=display)
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

    def send_message(self, author: str, content: str, prompt: str = None, language: str = None, indent=0, is_error=False, llm_settings: LLMSettings = None, end_stream=False):
        """Send a message to the client."""
        if not self.emit:
            return

        if llm_settings is None and prompt is not None:
            llm_settings = LLMSettings()

        if llm_settings:
            llm_settings = llm_settings.to_dict()

        msg = {
            "author": author,
            "content": content,
            "indent": indent,
            "language": language,
            "isError": is_error,
            "prompt": prompt,
            "llmSettings": llm_settings,
        }
        if self.client:
            message_id = self.client.create_message(msg)
            msg["id"] = message_id
        if end_stream:
            self.stream_end(msg)
        else:
            self.emit("message", msg)

    def send_ask_timeout(self, author: str):
        """Send a prompt timeout message to the client."""
        self.send_message(
            author=author, content="Time out", is_error=True)

        if self.emit:
            self.emit("ask_timeout", {})

    def send_ask_user(self, author: str, content: str, spec: AskSpec, raise_on_timeout=False):
        """Send a prompt to the client and wait for a response."""
        if not self.ask_user:
            return

        msg = {
            "author": author,
            "content": content,
            "waitForAnswer": True,
        }

        if self.client:
            message_id = self.client.create_message(msg)
            msg["id"] = message_id

        try:
            self.task_end()
            res = self.ask_user(
                {"msg": msg, "spec": spec.to_dict()}, spec.timeout)
            if self.client and res:
                if spec.type == "text":
                    res_msg = {
                        "author": res["author"],
                        "authorIsUser": True,
                        "content": res["content"],
                    }
                    self.client.create_message(res_msg)
                elif spec.type == "file":
                    # TODO: upload file to S3
                    pass

            return res
        except TimeoutError as e:
            self.send_ask_timeout(author)
            if raise_on_timeout:
                raise e
        finally:
            self.task_start()

    def update_token_count(self, count: int):
        """Update the token count for the client."""
        if not self.emit:
            return
        self.emit("token_usage", count)

    def task_start(self):
        """
        Send a task start message to the chatbot UI.

        """
        if self.emit:
            self.emit('task_start', {})

    def task_end(self):
        """
        Send a task end message to the chatbot UI.

        """
        if self.emit:
            self.emit('task_end', {})

    def stream_start(self, author: str, indent: int, language: str = None, llm_settings: LLMSettings = None):
        """
        """
        if self.emit:
            self.emit('stream_start', {"author": author, "indent": indent, "language": language, "content": "",
                      "llmSettings": llm_settings.to_dict() if llm_settings else None})

    def send_token(self, token: str):
        """
        """
        if self.emit:
            self.emit('stream_token', token)

    def stream_end(self, msg):
        """
        """
        if self.emit:
            self.emit('stream_end', msg)


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
