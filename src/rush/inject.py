from typing import Callable, TypedDict, Literal, Optional
from dataclasses import dataclass
from langchain.callbacks.base import CallbackManager


class DocumentSpec(TypedDict):
    name: str
    display: Literal["embbed", "side"]
    type: Optional[Literal["image", "text"]]


@dataclass
class RushInject:
    callback_manager: CallbackManager
    send_local_image: Callable[[str, DocumentSpec], None]
    send_text_document: Callable[[str, DocumentSpec], None]
