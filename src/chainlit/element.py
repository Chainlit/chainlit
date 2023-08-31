import json
import uuid
from enum import Enum
from io import BytesIO
from typing import Any, ClassVar, Dict, List, Optional, TypeVar, Union, cast

import aiofiles
import filetype
from pydantic.dataclasses import Field, dataclass

from chainlit.client.base import BaseDBClient, ElementDict
from chainlit.context import context
from chainlit.telemetry import trace_event
from chainlit.types import ElementDisplay, ElementSize, ElementType

mime_types = {
    "text": "text/plain",
    "tasklist": "application/json",
}


@dataclass
class Element:
    # The type of the element. This will be used to determine how to display the element in the UI.
    type: ClassVar[ElementType]

    # The ID of the element. This is set automatically when the element is sent to the UI.
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Name of the element, this will be used to reference the element in the UI.
    name: Optional[str] = None
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
    for_ids: List[str] = Field(default_factory=list)
    # The language, if relevant
    language: Optional[str] = None

    def __post_init__(self) -> None:
        trace_event(f"init {self.__class__.__name__}")
        self.persisted = False

        if not self.url and not self.path and not self.content:
            raise ValueError("Must provide url, path or content to instantiate element")

    def to_dict(self) -> ElementDict:
        _dict = ElementDict(
            {
                "id": self.id,
                "type": self.type,
                "url": self.url or "",
                "name": self.name or "",
                "display": self.display,
                "objectKey": getattr(self, "object_key", None),
                "size": getattr(self, "size", None),
                "language": getattr(self, "language", None),
                "forIds": getattr(self, "for_ids", None),
                "conversationId": None,
            }
        )
        return _dict

    async def preprocess_content(self):
        pass

    async def load(self):
        if self.path:
            async with aiofiles.open(self.path, "rb") as f:
                self.content = await f.read()
        else:
            raise ValueError("Must provide path or content to load element")

    async def persist(self, client: BaseDBClient) -> ElementDict:
        if not self.url and self.content and not self.persisted:
            # Only guess the mime type when the content is binary
            mime = (
                mime_types[self.type]
                if self.type in mime_types
                else filetype.guess_mime(self.content)
            )
            upload_res = await client.upload_element(content=self.content, mime=mime)
            self.url = upload_res["url"]
            self.object_key = upload_res["object_key"]

        if not self.persisted:
            element_dict = await client.create_element(self.to_dict())
            self.persisted = True
        else:
            element_dict = await client.update_element(self.to_dict())
        return element_dict

    async def before_emit(self, element: Dict) -> Dict:
        return element

    async def remove(self):
        trace_event(f"remove {self.__class__.__name__}")
        await context.emitter.emit("remove_element", {"id": self.id})

    async def send(self, for_id: Optional[str] = None):
        if not self.content and not self.url and self.path:
            await self.load()

        await self.preprocess_content()

        if for_id and for_id not in self.for_ids:
            self.for_ids.append(for_id)

        # We have a client, persist the element
        if context.emitter.db_client:
            element_dict = await self.persist(context.emitter.db_client)
            self.id = element_dict["id"]

        elif not self.url and not self.content:
            raise ValueError("Must provide url or content to send element")

        emit_dict = cast(Dict, self.to_dict())

        # Adding this out of to_dict since the dict will be persisted in the DB
        emit_dict["content"] = self.content

        if context.emitter.emit:
            # Element was already sent
            if len(self.for_ids) > 1:
                trace_event(f"update {self.__class__.__name__}")
                await context.emitter.emit(
                    "update_element",
                    {"id": self.id, "forIds": self.for_ids},
                )
            else:
                trace_event(f"send {self.__class__.__name__}")
                emit_dict = await self.before_emit(emit_dict)
                await context.emitter.emit("element", emit_dict)


ElementBased = TypeVar("ElementBased", bound=Element)


@dataclass
class Image(Element):
    type: ClassVar[ElementType] = "image"

    size: ElementSize = "medium"


@dataclass
class Avatar(Element):
    type: ClassVar[ElementType] = "avatar"

    async def send(self):
        element = None

        if not self.content and not self.url and self.path:
            await self.load()

        if not self.url and not self.content:
            raise ValueError("Must provide url or content to send element")

        element = self.to_dict()

        # Adding this out of to_dict since the dict will be persisted in the DB
        element["content"] = self.content

        if context.emitter.emit and element:
            trace_event(f"send {self.__class__.__name__}")
            element = await self.before_emit(element)
            await context.emitter.emit("element", element)


@dataclass
class Text(Element):
    """Useful to send a text (not a message) to the UI."""

    type: ClassVar[ElementType] = "text"

    content: bytes = b""
    language: Optional[str] = None

    async def before_emit(self, text_element):
        if "content" in text_element and isinstance(text_element["content"], bytes):
            text_element["content"] = text_element["content"].decode("utf-8")
        return text_element


@dataclass
class Pdf(Element):
    """Useful to send a pdf to the UI."""

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

    def __init__(self):
        self.tasks = []
        self.content = "dummy content to pass validation"
        self.name = "tasklist"
        self.type = "tasklist"
        super().__post_init__()

    async def add_task(self, task: Task):
        self.tasks.append(task)

    async def update(self):
        await self.send()

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
            }
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
