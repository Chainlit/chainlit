from typing import Callable, TypedDict, Literal, Optional
from dataclasses import dataclass
from langchain.callbacks.base import CallbackManager


class DocumentSpec(TypedDict):
    name: str
    display: Literal["embbed", "side"]
    type: Optional[Literal["image"]]


@dataclass
class RushInject:
    callback_manager: CallbackManager
    send_local_image: Callable[[str, DocumentSpec], None]
