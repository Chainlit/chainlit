import json
import uuid
from enum import Enum
from io import BytesIO
from typing import Any, ClassVar, List, Literal, Optional, TypedDict, TypeVar, Union

import filetype
from chainlit.context import context
from chainlit.data import get_data_layer
from chainlit.logger import logger
from chainlit.telemetry import trace_event
from chainlit.types import FileDict
from pydantic.dataclasses import Field, dataclass
from syncer import asyncio

mime_types = {
    "text": "text/plain",
    "tasklist": "application/json",
    "plotly": "application/json",
}

ElementType = Literal[
    "image", "avatar", "text", "pdf", "tasklist", "audio", "video", "file", "plotly"
]
ElementDisplay = Literal["inline", "side", "page"]
ElementSize = Literal["small", "medium", "large"]


class ElementDict(TypedDict):
    id: str
    threadId: Optional[str]
    type: ElementType
    chainlitKey: Optional[str]
    url: Optional[str]
    objectKey: Optional[str]
    name: str
    display: ElementDisplay
    size: Optional[ElementSize]
    language: Optional[str]
    page: Optional[int]
    forId: Optional[str]
    mime: Optional[str]


@dataclass
class Element:
    # The type of the element. This will be used to determine how to display the element in the UI.
    type: ClassVar[ElementType]
    # Name of the element, this will be used to reference the element in the UI.
    name: str = ""
    # The ID of the element. This is set automatically when the element is sent to the UI.
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # The key of the element hosted on Chainlit.
    chainlit_key: Optional[str] = None
    # The URL of the element if already hosted somehwere else.
    url: Optional[str] = None
    # The S3 object key.
    object_key: Optional[str] = None
    # The local path of the element.
    path: Optional[str] = None
    # The byte content of the element.
    content: Optional[Union[bytes, str]] = None
    # Controls how the image element should be displayed in the UI. Choices are “side” (default), “inline”, or “page”.
    display: ElementDisplay = Field(default="side")
    # Controls element size
    size: Optional[ElementSize] = None
    # The ID of the message this element is associated with.
    for_id: Optional[str] = None
    # The language, if relevant
    language: Optional[str] = None
    # Mime type, infered based on content if not provided
    mime: Optional[str] = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")
        self.persisted = False
        self.updatable = False
        self.thread_id = context.session.thread_id

        if not self.url and not self.path and not self.content:
            raise ValueError("Must provide url, path or content to instantiate element")

    def to_dict(self) -> ElementDict:
        _dict = ElementDict(
            {
                "id": self.id,
                "threadId": self.thread_id,
                "type": self.type,
                "url": self.url,
                "chainlitKey": self.chainlit_key,
                "name": self.name,
                "display": self.display,
                "objectKey": getattr(self, "object_key", None),
                "size": getattr(self, "size", None),
                "page": getattr(self, "page", None),
                "language": getattr(self, "language", None),
                "forId": getattr(self, "for_id", None),
                "mime": getattr(self, "mime", None),
            }
        )
        return _dict

    @classmethod
    def from_dict(self, _dict: FileDict):
        type = _dict.get("type", "")
        if "image" in type and "svg" not in type:
            return Image(
                id=_dict.get("id", str(uuid.uuid4())),
                name=_dict.get("name", ""),
                path=str(_dict.get("path")),
                chainlit_key=_dict.get("id"),
                display="inline",
                mime=type,
            )
        else:
            return File(
                id=_dict.get("id", str(uuid.uuid4())),
                name=_dict.get("name", ""),
                path=str(_dict.get("path")),
                chainlit_key=_dict.get("id"),
                display="inline",
                mime=type,
            )

    async def _create(self) -> bool:
        if (self.persisted or self.url) and not self.updatable:
            return True
        if data_layer := get_data_layer():
            try:
                asyncio.create_task(data_layer.create_element(self))
            except Exception as e:
                logger.error(f"Failed to create element: {str(e)}")
        if not self.chainlit_key or self.updatable:
            file_dict = await context.session.persist_file(
                name=self.name,
                path=self.path,
                content=self.content,
                mime=self.mime or "",
            )
            self.chainlit_key = file_dict["id"]

        self.persisted = True

        return True

    async def remove(self):
        trace_event(f"remove {self.__class__.__name__}")
        data_layer = get_data_layer()
        if data_layer and self.persisted:
            await data_layer.delete_element(self.id)
        await context.emitter.emit("remove_element", {"id": self.id})

    async def send(self, for_id: str):
        if self.persisted and not self.updatable:
            return

        self.for_id = for_id

        if not self.mime:
            # Only guess the mime type when the content is binary
            self.mime = (
                mime_types[self.type]
                if self.type in mime_types
                else filetype.guess_mime(self.path or self.content)
            )

        await self._create()

        if not self.url and not self.chainlit_key:
            raise ValueError("Must provide url or chainlit key to send element")

        trace_event(f"send {self.__class__.__name__}")
        await context.emitter.emit("element", self.to_dict())


ElementBased = TypeVar("ElementBased", bound=Element)


@dataclass
class Image(Element):
    type: ClassVar[ElementType] = "image"

    size: ElementSize = "medium"


@dataclass
class Avatar(Element):
    type: ClassVar[ElementType] = "avatar"

    async def send(self):
        await super().send(for_id="")


@dataclass
class Text(Element):
    """Useful to send a text (not a message) to the UI."""

    type: ClassVar[ElementType] = "text"
    language: Optional[str] = None


@dataclass
class Pdf(Element):
    """Useful to send a pdf to the UI."""

    page: Optional[int] = None
    type: ClassVar[ElementType] = "pdf"


@dataclass
class Pyplot(Element):
    """Useful to send a pyplot to the UI."""

    # We reuse the frontend image element to display the chart
    type: ClassVar[ElementType] = "image"

    size: ElementSize = "medium"
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


class TaskStatus(Enum):
    READY = "ready"
    RUNNING = "running"
    FAILED = "failed"
    DONE = "done"


@dataclass
class Task:
    title: str
    status: TaskStatus = TaskStatus.READY
    forId: Optional[str] = None

    def __init__(
        self,
        title: str,
        status: TaskStatus = TaskStatus.READY,
        forId: Optional[str] = None,
    ):
        self.title = title
        self.status = status
        self.forId = forId


@dataclass
class TaskList(Element):
    type: ClassVar[ElementType] = "tasklist"
    tasks: List[Task] = Field(default_factory=list, exclude=True)
    status: str = "Ready"
    name: str = "tasklist"
    content: str = "dummy content to pass validation"

    def __post_init__(self) -> None:
        super().__post_init__()
        self.updatable = True

    async def add_task(self, task: Task):
        self.tasks.append(task)

    async def update(self):
        await self.send()

    async def send(self):
        await self.preprocess_content()
        await super().send(for_id="")

    async def preprocess_content(self):
        # serialize enum
        tasks = [
            {"title": task.title, "status": task.status.value, "forId": task.forId}
            for task in self.tasks
        ]

        # store stringified json in content so that it's correctly stored in the database
        self.content = json.dumps(
            {
                "status": self.status,
                "tasks": tasks,
            },
            indent=4,
            ensure_ascii=False,
        )


@dataclass
class Audio(Element):
    type: ClassVar[ElementType] = "audio"


@dataclass
class Video(Element):
    type: ClassVar[ElementType] = "video"

    size: ElementSize = "medium"


@dataclass
class File(Element):
    type: ClassVar[ElementType] = "file"


@dataclass
class Plotly(Element):
    """Useful to send a plotly to the UI."""

    type: ClassVar[ElementType] = "plotly"

    size: ElementSize = "medium"
    # The type is set to Any because the figure is not serializable
    # and its actual type is checked in __post_init__.
    figure: Any = None
    content: str = ""

    def __post_init__(self) -> None:
        from plotly import graph_objects as go
        from plotly import io as pio

        if not isinstance(self.figure, go.Figure):
            raise TypeError("figure must be a plotly.graph_objects.Figure")

        self.figure.layout.autosize = True
        self.figure.layout.width = None
        self.figure.layout.height = None
        self.content = pio.to_json(self.figure, validate=True)
        self.mime = "application/json"

        super().__post_init__()
