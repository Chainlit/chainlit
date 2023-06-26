from pydantic.dataclasses import dataclass
from typing import Dict, List, Union, Any
import uuid
import aiofiles
from io import BytesIO

from chainlit.context import get_emitter
from chainlit.client.base import BaseClient
from chainlit.telemetry import trace_event
from chainlit.types import ElementType, ElementDisplay, ElementSize

type_to_mime = {
    "image": "image/png",
    "text": "text/plain",
    "pdf": "application/pdf",
}

mime_to_ext = {
    "image/png": "png",
    "text/plain": "txt",
    "application/pdf": "pdf",
}


@dataclass
class Element:
    # Name of the element, this will be used to reference the element in the UI.
    name: str
    # The type of the element. This will be used to determine how to display the element in the UI.
    type: ElementType
    # Controls how the image element should be displayed in the UI. Choices are “side” (default), “inline”, or “page”.
    display: ElementDisplay = "side"
    # The URL of the element if already hosted somehwere else.
    url: str = None
    # The local path of the element.
    path: str = None
    # The byte content of the element.
    content: bytes = None
    # The ID of the element. This is set automatically when the element is sent to the UI if cloud is enabled.
    id: int = None
    # The ID of the element if cloud is disabled.
    temp_id: str = None
    # The ID of the message this element is associated with.
    for_ids: List[str] = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")
        self.emitter = get_emitter()
        self.for_ids = []
        self.temp_id = str(uuid.uuid4())

        if not self.url and not self.path and not self.content:
            raise ValueError("Must provide url, path or content to instantiate element")

    def to_dict(self) -> Dict:
        _dict = {
            "tempId": self.temp_id,
            "type": self.type,
            "url": self.url,
            "name": self.name,
            "display": self.display,
            "size": getattr(self, "size", None),
            "language": getattr(self, "language", None),
            "forIds": getattr(self, "for_ids", None),
        }

        if self.id:
            _dict["id"] = self.id

        return _dict

    async def preprocess_content(self):
        pass

    async def load(self):
        if self.path:
            async with aiofiles.open(self.path, "rb") as f:
                self.content = await f.read()
        else:
            raise ValueError("Must provide path or content to load element")

    async def persist(self, client: BaseClient):
        if not self.url and self.content and not self.id:
            self.url = await client.upload_element(
                content=self.content, mime=type_to_mime[self.type]
            )
        element = await client.upsert_element(self.to_dict())
        return element

    async def before_emit(self, element: Dict) -> Dict:
        return element

    async def send(self, for_id: str = None):
        element = None

        if not self.content and not self.url and self.path:
            await self.load()

        await self.preprocess_content()

        if for_id:
            self.for_ids.append(for_id)

        # We have a client, persist the element
        if self.emitter.client:
            element = await self.persist(self.emitter.client)
            self.id = element and element.get("id")

        elif not self.url and not self.content:
            raise ValueError("Must provide url or content to send element")

        element = self.to_dict()

        element["content"] = self.content

        if self.emitter.emit and element:
            if len(self.for_ids) > 1:
                trace_event(f"update {self.__class__.__name__}")
                await self.emitter.emit(
                    "update_element",
                    {"id": self.id or self.temp_id, "forIds": self.for_ids},
                )
            else:
                trace_event(f"send {self.__class__.__name__}")
                element = await self.before_emit(element)
                await self.emitter.emit("element", element)


@dataclass
class Image(Element):
    type: ElementType = "image"
    size: ElementSize = "medium"


@dataclass
class Avatar(Element):
    type: ElementType = "avatar"

    async def send(self):
        element = None

        if not self.content and not self.url and self.path:
            await self.load()

        if not self.url and not self.content:
            raise ValueError("Must provide url or content to send element")

        element = self.to_dict()

        if self.emitter.emit and element:
            trace_event(f"send {self.__class__.__name__}")
            element = await self.before_emit(element)
            await self.emitter.emit("element", element)


@dataclass
class Text(Element):
    """Useful to send a text (not a message) to the UI."""

    content: Union[str, bytes] = None
    type: ElementType = "text"
    language: str = None

    async def preprocess_content(self):
        if isinstance(self.content, str):
            self.content = self.content.encode("utf-8")

    async def before_emit(self, text_element):
        if "content" in text_element and isinstance(text_element["content"], bytes):
            text_element["content"] = text_element["content"].decode("utf-8")
        return text_element


@dataclass
class Pdf(Element):
    """Useful to send a pdf to the UI."""

    type: ElementType = "pdf"


@dataclass
class Pyplot(Element):
    """Useful to send a pyplot to the UI."""

    # We reuse the frontend image element to display the chart
    type: ElementType = "image"
    # The type is set to Any because the figure is not serializable
    # and its actual type is checked in __post_init__.
    figure: Any = None

    def __post_init__(self) -> None:
        from matplotlib.figure import Figure

        if not isinstance(self.figure, Figure):
            raise TypeError("figure must be a matplotlib.figure.Figure")

        options = {
            "dpi": 200,
            "bbox_inches": "tight",
            "backend": "Agg",
            "format": "png",
        }
        image = BytesIO()
        self.figure.savefig(image, **options)
        self.content = image.getvalue()

        super().__post_init__()
