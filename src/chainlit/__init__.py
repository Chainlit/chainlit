from typing import Any, Callable, Union
import inspect
from langchain.callbacks.base import CallbackManager
from langchain.callbacks import OpenAICallbackHandler
from chainlit.uihandler import UiCallbackHandler
from chainlit.session import sessions
from chainlit.types import DocumentDisplay, DocumentSpec, LLMSettings


def get_session_id() -> Union[str, None]:
    names = [i[0].f_globals["__name__"] for i in inspect.stack()]

    for name in names:
        if name in sessions:
            return name

    return None


def populate_session(cl: 'Chainlit'):
    session_id = get_session_id()
    if session_id:
        print(f"chainlit session: {session_id}")
        cl.session_id = session_id
        cl.emit = sessions[session_id]["emit"]
    else:
        cl.session_id = None
        cl.emit = None
        print("No chainlit session found")


class Chainlit:
    emit: Callable[[str, Any], None]
    session_id: str

    def __init__(self, emit=None, session_id=None) -> None:
        if emit and session_id:
            self.emit = emit
            self.session_id = session_id
        else:
            populate_session(self)

    def callback_manager(self, handlers=None):
        if self.emit is not None:
            return CallbackManager(
                [UiCallbackHandler(sdk=self), OpenAICallbackHandler()])
        else:
            if handlers is None:
                return None
            else:
                return CallbackManager(handlers)

    def send_local_image(self, path: str, name: str, display: DocumentDisplay = "side"):
        if self.emit is None:
            return
        with open(path, 'rb') as f:
            image_data = f.read()
            spec = DocumentSpec(name, display, "image").to_dict()
            self.emit('document', {"spec": spec,
                                   'content': image_data})

    def send_text_document(self, text: str, name: str, display: DocumentDisplay = "side"):
        if self.emit is None:
            return
        spec = DocumentSpec(name, display, "text").to_dict()
        self.emit('document', {"spec": spec,
                               'content': text})

    def send_message(self, author: str, content: str, prompt: str = None, language: str = None, indent=0, is_error=False, final=False, llm_settings: LLMSettings = None):
        if self.emit is None:
            return
        if llm_settings is None:
            llm_settings = LLMSettings()

        msg = {
            "author": author,
            "content": content,
            "indent": indent,
            "language": language,
            "is_error": is_error,
            "prompt": prompt,
            "llm_settings": llm_settings.to_dict(),
            "final": final,
        }

        self.emit("message", msg)

    def update_token_count(self, count: int):
        if self.emit is None:
            return
        self.emit("total_tokens", count)
