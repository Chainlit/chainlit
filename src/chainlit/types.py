from typing import List, TypedDict, Optional, Literal
from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json

ElementType = Literal["image", "text"]
ElementDisplay = Literal["inline", "side", "page"]


@dataclass_json
@dataclass
class AskSpec:
    """Specification for asking the user."""

    timeout: int
    type: Literal["text", "file"]


@dataclass_json
@dataclass
class AskFileSpec(AskSpec):
    """Specification for asking the user for a file."""

    accept: List[str]
    max_size_mb: int


class AskResponse(TypedDict):
    content: str
    author: str


@dataclass
class AskFileResponse:
    name: str
    path: str
    size: int
    type: str
    content: bytes


@dataclass_json
@dataclass
class LLMSettings:
    model_name: str = "text-davinci-003"
    stop: Optional[List[str]] = None
    temperature: float = 0
    max_tokens: int = 256
    top_p: int = 1
    frequency_penalty: int = 0
    presence_penalty: int = 0
