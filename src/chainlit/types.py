from typing import List, TypedDict, Optional, Literal
from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json

DocumentType = Literal["image", "text"]
DocumentDisplay = Literal["inline", "side", "page"]


class PromptResponse(TypedDict):
    content: str
    author: str


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
