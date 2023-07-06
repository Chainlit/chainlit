from pydantic.dataclasses import dataclass, Field
from dataclasses_json import dataclass_json
from typing import Dict, List, Union, Any
import uuid
import aiofiles
from io import BytesIO
from enum import Enum
import json
import filetype

from chainlit.context import get_emitter
from chainlit.client.base import BaseDBClient
from chainlit.telemetry import trace_event
from chainlit.types import ElementType, ElementDisplay, ElementSize

mime_types = {
    "text": "text/plain",
    "tasklist": "application/json",
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

    async def persist(self, client: BaseDBClient):
        if not self.url and self.content and not self.id:
            # Only guess the mime type when the content is binary
            mime = (
                mime_types[self.type]
                if self.type in mime_types
                else filetype.guess_mime(self.content)
            )
            self.url = await client.upload_element(content=self.content, mime=mime)
        element = await client.upsert_element(self.to_dict())
        return element

    async def before_emit(self, element: Dict) -> Dict:
        return element

    async def remove(self):
        trace_event(f"remove {self.__class__.__name__}")
        await self.emitter.emit("remove_element", {"id": self.id or self.temp_id})

    async def send(self, for_id: str = None):
        element = None

        if not self.content and not self.url and self.path:
            await self.load()

        await self.preprocess_content()

        if for_id:
            self.for_ids.append(for_id)

        # We have a client, persist the element
        if self.emitter.db_client:
            element = await self.persist(self.emitter.db_client)
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
    title: str = None
    status: TaskStatus = TaskStatus.READY
    forId: str = None

    def __init__(
        self,
        title: str,
        status: TaskStatus = TaskStatus.READY,
        forId: str = None,
    ):
        self.title = title
        self.status = status
        self.forId = forId

    def __post_init__(self) -> None:
        super().__post_init__()


@dataclass
class TaskList(Element):
    type = "tasklist"
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
    type: ElementType = "audio"
