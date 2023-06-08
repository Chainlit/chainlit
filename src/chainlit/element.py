from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json
from typing import Dict
import uuid
from abc import ABC, abstractmethod
from chainlit.sdk import get_sdk, BaseClient
from chainlit.telemetry import trace_event
from chainlit.types import ElementType, ElementDisplay, ElementSize
from base64 import b64encode, b64decode
from urllib import parse as urlparse


@dataclass_json
@dataclass
class Element(ABC):
    name: str
    type: ElementType
    display: ElementDisplay = "side"
    id: int = None
    tempId: str = None
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

        element = None

        # Cloud is enabled, upload the element to S3
        if sdk.client:
            element = self.persist(sdk.client, for_id)
            self.id = element["id"]

        if not element:
            self.tempId = uuid.uuid4().hex
            element = self.to_dict()
            if for_id:
                element["forId"] = for_id

        if sdk.emit and element:
            trace_event(f"send {self.__class__.__name__}")
            element = self.before_emit(element)
            sdk.emit("element", element)


@dataclass
class LocalElement(Element):
    content: bytes = None

    def persist(self, client: BaseClient, for_id: str = None):
        if not self.content:
            raise ValueError("Must provide content")
        url = client.upload_element(content=self.content, mime=None)
        if url:
            size = getattr(self, "size", None)
            language = getattr(self, "language", None)
            element = client.create_element(
                name=self.name,
                url=url,
                type=self.type,
                display=self.display,
                size=size,
                language=language,
                for_id=for_id,
            )
            return element


@dataclass
class RemoteElementBase:
    url: str


@dataclass
class ImageBase:
    type: ElementType = "image"
    size: ElementSize = "medium"


@dataclass
class RemoteElement(Element, RemoteElementBase):
    def persist(self, client: BaseClient, for_id: str = None):
        size = getattr(self, "size", None)
        language = getattr(self, "language", None)
        element = client.create_element(
            name=self.name,
            url=self.url,
            type=self.type,
            display=self.display,
            size=size,
            language=language,
            for_id=for_id,
        )
        return element


@dataclass
class LocalImage(ImageBase, LocalElement):
    """Useful to send an image living on the local filesystem to the UI."""

    path: str = None

    def __post_init__(self):
        if self.path:
            with open(self.path, "rb") as f:
                self.content = f.read()
        elif self.content:
            self.content = self.content
        else:
            raise ValueError("Must provide either path or content")


@dataclass
class RemoteImage(ImageBase, RemoteElement):
    """Useful to send an image based on an URL to the UI."""

    pass


@dataclass
class TextBase:
    text: str


@dataclass
class Text(LocalElement, TextBase):
    """Useful to send a text (not a message) to the UI."""

    type: ElementType = "text"
    content = bytes("", "utf-8")
    language: str = None

    def __post_init__(self):
        self.content = bytes(self.text, "utf-8")

    def before_emit(self, text_element):
        if "content" in text_element and isinstance(text_element["content"], bytes):
            text_element["content"] = text_element["content"].decode("utf-8")
        return text_element


@dataclass
class Pdf(Element):
    """Useful to send a pdf (remote or local) to the UI."""

    type: ElementType = "pdf"
    url: str = None
    path: str = None
    content: bytes = None

    def persist(self, client: BaseClient, for_id: str = None):
        if not self.content and not self.url:
            raise ValueError("Must provide content or url")

        # Either upload the content or use the url
        url = None
        if self.content:
            url = client.upload_element(content=self.content, mime="application/pdf")
        else:
            url = self.url

        if url:
            element = client.create_element(
                name=self.name,
                url=url,
                type=self.type,
                display=self.display,
                for_id=for_id,
            )
            return element

    def __post_init__(self):
        if self.path:
            with open(self.path, "rb") as f:
                self.content = f.read()
        elif self.content or self.url:
            pass  # do nothing here
        else:
            raise ValueError("Must provide either path, content or url")
