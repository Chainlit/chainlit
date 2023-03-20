from typing import List, Optional, Any, Union, Literal
from dataclasses import dataclass
from dataclasses_json import dataclass_json
from langchain.callbacks.base import CallbackManager
from langchain.callbacks import OpenAICallbackHandler
from chainlit.uihandler import UiCallbackHandler

DocumentType = Literal["image", "text"]
DocumentDisplay = Literal["embbed", "side", "fullscreen"]


@dataclass_json
@dataclass
class LLMSettings():
    model_name: str = "text-davinci-003"
    stop: Optional[List[str]] = None
    temperature: float = 0
    max_tokens: int = 256
    top_p: int = 1
    frequency_penalty: int = 0
    presence_penalty: int = 0


@dataclass_json
@dataclass
class DocumentSpec():
    name: str
    display: DocumentType
    type: DocumentDisplay


class Chainlit:
    emit: Any

    def __init__(self, emit) -> None:
        self.emit = emit

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

    def send_message(self, author: str, content: str, prompts: Union[str, List[str]] = [], language: str = None, indent=0, is_error=False, final=False, llm_settings: LLMSettings = None):
        if self.emit is None:
            return
        if llm_settings is None:
            llm_settings = LLMSettings()

        self.emit("message", {
            "author": author,
            "content": content,
            "indent": indent,
            "language": language,
            "error": is_error,
            "prompts": prompts,
            "llm_settings": llm_settings.to_dict(),
            "final": final,
        })

    def update_token_count(self, count: int):
        if self.emit is None:
            return
        self.emit("total_tokens", count)
