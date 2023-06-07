from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json
from typing import Dict, Union
from abc import ABC, abstractmethod
import uuid

import aiofiles

from chainlit.emitter import get_emitter, BaseClient
from chainlit.telemetry import trace_event
from chainlit.types import ElementType, ElementDisplay, ElementSize


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
        self.emitter = get_emitter()
        if not self.emitter:
            raise RuntimeError("Element should be instantiated in a Chainlit context")

    @abstractmethod
    async def persist(self, client: BaseClient, for_id: str = None) -> Dict:
        pass

    async def before_emit(self, element: Dict) -> Dict:
        return element

    async def send(self, for_id: str = None):
        element = None

        # Cloud is enabled, upload the element to S3
        if self.emitter.client:
            element = await self.persist(self.emitter.client, for_id)

        if element:
            self.id = element["id"]
        elif not element:
            self.tempId = uuid.uuid4().hex
            element = self.to_dict()
            if for_id:
                element["forId"] = for_id

        if self.emitter.emit and element:
            trace_event(f"send {self.__class__.__name__}")
            element = await self.before_emit(element)
            await self.emitter.emit("element", element)


@dataclass
class LocalElement(Element):
    path: str = None
    content: bytes = None

    async def persist(self, client: BaseClient, for_id: str = None):
        if not self.content:
            raise ValueError("Must provide content")
        url = await client.upload_element(content=self.content)
        if url:
            size = getattr(self, "size", None)
            language = getattr(self, "language", None)
            element = await client.create_element(
                name=self.name,
                url=url,
                type=self.type,
                display=self.display,
                size=size,
                language=language,
                for_id=for_id,
            )
            return element

    async def preprocess_content(self):
        pass

    async def load(self):
        if self.path:
            async with aiofiles.open(self.path, "rb") as f:
                self.content = await f.read()
        elif self.content:
            await self.preprocess_content()
            return
        else:
            raise ValueError("Must provide path or content for LocalElement")

    async def send(self, for_id: str = None):
        await self.load()
        await super().send(for_id)


@dataclass
class RemoteElementBase:
    url: str


@dataclass
class ImageBase:
    type: ElementType = "image"
    size: ElementSize = "medium"


@dataclass
class RemoteElement(Element, RemoteElementBase):
    async def persist(self, client: BaseClient, for_id: str = None):
        size = getattr(self, "size", None)
        language = getattr(self, "language", None)
        element = await client.create_element(
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

    def __post_init__(self):
        super().__post_init__()
        if self.path:
            with open(self.path, "rb") as f:
                self.content = f.read()
        elif self.content:
            pass
        else:
            raise ValueError("Must provide either path or content")


@dataclass
class RemoteImage(ImageBase, RemoteElement):
    """Useful to send an image based on an URL to the UI."""

    pass


@dataclass
class TextBase:
    content: Union[str, bytes] = None
    type: ElementType = "text"
    language: str = None


@dataclass
class Text(TextBase, LocalElement):
    """Useful to send a text (not a message) to the UI."""

    async def preprocess_content(self):
        if isinstance(self.content, str):
            self.content = self.content.encode("utf-8")

    async def before_emit(self, text_element):
        if "content" in text_element and isinstance(text_element["content"], bytes):
            text_element["content"] = text_element["content"].decode("utf-8")
        return text_element
