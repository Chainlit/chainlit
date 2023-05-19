from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json
from typing import Dict
from abc import ABC, abstractmethod
from chainlit.sdk import get_sdk, BaseClient
from chainlit.telemetry import trace_event
from chainlit.types import ElementType, ElementDisplay


@dataclass_json
@dataclass
class Element(ABC):
    name: str
    type: ElementType
    display: ElementDisplay = "side"
    forId: str = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")

    @abstractmethod
    def persist(self, client: BaseClient, for_id: str = None) -> Dict:
        pass

    def before_emit(self, element: Dict) -> Dict:
        return element

    def send(self, for_id: str = None):
        sdk = get_sdk()

        # Cloud is enabled, upload the element to S3
        if sdk.client:
            element = self.persist(sdk.client, for_id)
        else:
            element = self.to_dict()
            if for_id:
                element["forId"] = for_id

        if sdk.emit and element:
            trace_event(f"send {self.__class__.__name__}")
            element = self.before_emit(element)
            sdk.emit("element", element)


@dataclass
class LocalElementBase:
    content: bytes


@dataclass
class LocalElement(Element, LocalElementBase):
    def persist(self, client: BaseClient, for_id: str = None):
        url = client.upload_element(content=self.content)
        if url:
            element = client.create_element(
                name=self.name,
                url=url,
                type=self.type,
                display=self.display,
                for_id=for_id,
            )
            return element


@dataclass
class RemoteElementBase:
    url: str


@dataclass
class RemoteElement(Element, RemoteElementBase):
    def persist(self, client: BaseClient, for_id: str = None):
        element = client.create_element(
            name=self.name,
            url=self.url,
            type=self.type,
            display=self.display,
            for_id=for_id,
        )
        return element


class LocalImage(LocalElement):
    def __init__(
        self,
        name: str,
        display: ElementDisplay = "side",
        path: str = None,
        content: bytes = None,
    ):
        if path:
            with open(path, "rb") as f:
                self.content = f.read()
        elif content:
            self.content = content
        else:
            raise ValueError("Must provide either path or content")

        self.name = name
        self.display = display
        self.type = "image"


class RemoteImage(RemoteElement):
    def __init__(self, name: str, url: str, display: ElementDisplay = "side"):
        self.name = name
        self.display = display
        self.type = "image"
        self.url = url


class Text(LocalElement):
    def __init__(self, name: str, text: str, display: ElementDisplay = "side"):
        self.name = name
        self.display = display
        self.type = "text"
        self.content = bytes(text, "utf-8")

    def before_emit(self, text_element):
        if "content" in text_element and isinstance(text_element["content"], bytes):
            text_element["content"] = text_element["content"].decode("utf-8")
        return text_element
