from pydantic.dataclasses import dataclass
from dataclasses_json import dataclass_json
from typing import Dict, Union, Any
import uuid
import aiofiles
from io import BytesIO

from chainlit.emitter import get_emitter, BaseClient
from chainlit.telemetry import trace_event
from chainlit.types import ElementType, ElementDisplay, ElementSize

type_to_mime = {
    "image": "binary/octet-stream",
    "text": "text/plain",
    "pdf": "application/pdf",
}


@dataclass_json
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
    tempId: str = None
    # The ID of the message this element is associated with.
    forId: str = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")
        self.emitter = get_emitter()
        if not self.emitter:
            raise RuntimeError("Element should be instantiated in a Chainlit context")

        if not self.url and not self.path and not self.content:
            raise ValueError("Must provide url, path or content to instantiate element")

        self.tempId = uuid.uuid4().hex

    async def preprocess_content(self):
        pass

    async def load(self):
        if self.path:
            async with aiofiles.open(self.path, "rb") as f:
                self.content = await f.read()
                await self.preprocess_content()
        elif self.content:
            await self.preprocess_content()
        else:
            raise ValueError("Must provide path or content to load element")

    async def persist(self, client: BaseClient, for_id: str = None):
        if not self.url and self.content:
            self.url = await client.upload_element(
                content=self.content, mime=type_to_mime[self.type]
            )

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

    async def before_emit(self, element: Dict) -> Dict:
        return element

    async def send(self, for_id: str = None):
        element = None

        if not self.content and not self.url and self.path:
            await self.load()

        # Cloud is enabled, upload the element to S3
        if self.emitter.client and not self.id:
            element = await self.persist(self.emitter.client, for_id)
            self.id = element["id"]

        elif not self.url and not self.content:
            raise ValueError("Must provide url or content to send element")

        element = self.to_dict()
        if for_id:
            element["forId"] = for_id

        if self.emitter.emit and element:
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

    async def before_emit(self, element: Dict) -> Dict:
        # Prevent the figure from being serialized
        del element["figure"]
        return element
