from typing import List, TypedDict, Optional, Literal
from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json

DocumentType = Literal["image", "text"]
DocumentDisplay = Literal["inline", "side", "page"]


@dataclass_json
@dataclass
class AskSpec():
    timeout: int
    type: Literal["text", "file"]


@dataclass_json
@dataclass
class AskFileSpec(AskSpec):
    accept: List[str]
    max_size_mb: int


@dataclass
class File():
    name: str
    path: str
    size: int
    type: str
    content: bytes


class AskResponse(TypedDict):
    content: str
    author: str


class Action(TypedDict):
    name: str
    trigger: str
    description: str


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
