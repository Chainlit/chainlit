from typing import Optional, Dict, List, Literal, Union, ClassVar, TypeVar, Any, cast, get_args
from sqlmodel import SQLModel, Field
import uuid
from pydantic import ConfigDict, field_validator
from pydantic import PrivateAttr
from pydantic.alias_generators import to_camel
import asyncio
import filetype
from chainlit.context import context
from chainlit.data import get_data_layer
from chainlit.logger import logger
from chainlit.element import Task, TaskStatus
import json
from sqlalchemy import Column, JSON, ForeignKey, String

APPLICATION_JSON = "application/json"

mime_types = {
	"text": "text/plain",
	"tasklist": APPLICATION_JSON,
	"plotly": APPLICATION_JSON,
}

ElementType = Literal[
	"image",
	"text",
	"pdf",
	"tasklist",
	"audio",
	"video",
	"file",
	"plotly",
	"dataframe",
	"custom",
]
ElementDisplay = Literal["inline", "side", "page"]
ElementSize = Literal["small", "medium", "large"]

class Element(SQLModel, table=True):
	__tablename__ = "elements"
	
	id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
	thread_id: Optional[str] = Field(default=None, sa_column=Column(String, ForeignKey("threads.id", ondelete="CASCADE"), nullable=True))
	type: str = Field(..., nullable=False)
	name: str = ""
	url: Optional[str] = None
	path: Optional[str] = None
	object_key: Optional[str] = None
	chainlit_key: Optional[str] = None
	display: str = Field(..., nullable=False)
	size: Optional[str] = None
	language: Optional[str] = None
	mime: Optional[str] = None
	for_id: Optional[str] = Field(default=None, sa_column=Column(String, ForeignKey("steps.id", ondelete="CASCADE"), nullable=True))
	page: Optional[int] = None
	props: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))
	auto_play: Optional[bool] = None
	player_config: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))
	# Non-DB payload used by runtime logic (private attribute)
	_content: Optional[Union[str, bytes]] = PrivateAttr(default=None)

	model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)

	@property
	def content(self) -> Optional[Union[str, bytes]]:
		return self._content

	@content.setter
	def content(self, value: Optional[Union[str, bytes]]):
		self._content = value
	
	@field_validator("type", mode="before")
	def validate_type(cls, v):
		allowed = list(get_args(ElementType))
		if v not in allowed:
			raise ValueError(f"Invalid type: {v}. Must be one of: {allowed}")
		return v

	@field_validator("display", mode="before")
	def validate_display(cls, v):
		allowed = list(get_args(ElementDisplay))
		if v not in allowed:
			raise ValueError(f"Invalid display: {v}. Must be one of: {allowed}")
		return v
	
	@field_validator("size", mode="before")
	def validate_size(cls, v):
		if v is None:
			return v
		allowed = list(get_args(ElementSize))
		if v not in allowed:
			raise ValueError(f"Invalid size: {v}. Must be one of: {allowed}")
		return v

	def to_dict(self):
		return self.model_dump(by_alias=True)

	@classmethod
	def from_dict(cls, **kwargs):
		# Default to file if missing
		type_ = kwargs.get("type", "file")
		model = TYPE_MAP.get(type_, File)
		return model.model_validate(kwargs)

	@classmethod
	def infer_type_from_mime(cls, mime_type: str):
		"""Infer the element type from a mime type. Useful to know which element to instantiate from a file upload."""
		if "image" in mime_type:
			return "image"

		elif mime_type == "application/pdf":
			return "pdf"

		elif "audio" in mime_type:
			return "audio"

		elif "video" in mime_type:
			return "video"

		else:
			return "file"

	async def _create(self, persist=True) -> None:
		was_persisted = bool(getattr(self, "persisted", False))
		if was_persisted and not getattr(self, "updatable", False):
			return None

		data_layer = get_data_layer()
		if data_layer and persist:
			try:
				self._bg_task = asyncio.create_task(data_layer.create_element(self))
			except Exception as e:
				logger.error(f"Failed to create element: {e!s}")

		if not self.url and (not self.chainlit_key or getattr(self, "updatable", False)):
			file_dict = await context.session.persist_file(
				name=self.name,
				path=self.path,
				content=self.content,
				mime=self.mime or "",
			)
			self.chainlit_key = file_dict["id"]

		self.persisted = True
		return None

	async def remove(self):
		data_layer = get_data_layer()
		if data_layer:
			await data_layer.delete_element(self.id, self.thread_id)
		await context.emitter.emit("remove_element", {"id": self.id})

	async def send(self, for_id: str, persist=True):
		self.for_id = for_id

		if not self.mime:
			if hasattr(self, "type") and self.type in mime_types:
				self.mime = mime_types[self.type]
			elif self.path or isinstance(self.content, (bytes, bytearray)):
				import filetype
				file_type = filetype.guess(self.path or self.content)
				if file_type:
					self.mime = file_type.mime
			elif self.url:
				import mimetypes
				self.mime = mimetypes.guess_type(self.url)[0]

		await self._create(persist=persist)

		if not self.url and not self.chainlit_key:
			raise ValueError("Must provide url or chainlit key to send element")

		await context.emitter.send_element(self.to_dict())
		
ElementBased = TypeVar("ElementBased", bound=Element)

# Subclasses for runtime logic (not persisted, but can be instantiated from Element)
class Image(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "image"
	size: str = "medium"
	
class Text(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "text"
	language: Optional[str] = None
	
class Pdf(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "pdf"
	mime: str = "application/pdf"
	page: Optional[int] = None
	
class Pyplot(Element, table=False):
	__tablename__: ClassVar[None] = None
	"""Useful to send a pyplot to the UI."""
	type: str = "image"
	size: str = "medium"
	figure: Any = Field(default=None, exclude=True)
	
	def model_post_init(self, __context) -> None:
		if hasattr(self, "figure") and self.figure is not None:
			from matplotlib.figure import Figure
			from io import BytesIO
			if not isinstance(self.figure, Figure):
				raise TypeError("figure must be a matplotlib.figure.Figure")
			image = BytesIO()
			self.figure.savefig(
				image, dpi=200, bbox_inches="tight", backend="Agg", format="png"
			)
			self.content = image.getvalue()
		super().model_post_init(__context)
		
class TaskList(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "tasklist"
	tasks: List[Task] = Field(default_factory=list, exclude=True)
	status: str = "Ready"
	name: str = "tasklist"
	
	def model_post_init(self, __context) -> None:
		super().model_post_init(__context)
		self.updatable = True

	async def add_task(self, task: Task):
		self.tasks.append(task)

	async def update(self):
		await self.send(for_id=self.for_id or "")

	async def send(self, for_id: str, persist: bool = True):
		await self.preprocess_content()
		await super().send(for_id=for_id, persist=persist)

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

class Audio(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "audio"
	auto_play: bool = False

class Video(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "video"
	size: str = "medium"
	
class File(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "file"

class Plotly(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "plotly"
	size: str = "medium"
	figure: Any = Field(default=None, exclude=True)
	
	def model_post_init(self, __context) -> None:
		if hasattr(self, "figure") and self.figure is not None:
			from plotly import graph_objects as go, io as pio
			if not isinstance(self.figure, go.Figure):
				raise TypeError("figure must be a plotly.graph_objects.Figure")
			self.figure.layout.autosize = True
			self.figure.layout.width = None
			self.figure.layout.height = None
			self.content = pio.to_json(self.figure, validate=True)
			self.mime = APPLICATION_JSON
		super().model_post_init(__context)

class Dataframe(Element, table=False):
	__tablename__: ClassVar[None] = None
	type: str = "dataframe"
	size: str = "large"
	data: Any = Field(default=None, exclude=True)
	
	def model_post_init(self, __context) -> None:
		if hasattr(self, "data") and self.data is not None:
			from pandas import DataFrame
			if not isinstance(self.data, DataFrame):
				raise TypeError("data must be a pandas.DataFrame")
			self.content = self.data.to_json(orient="split", date_format="iso")
		super().model_post_init(__context)
	
class CustomElement(Element, table=False):
	__tablename__: ClassVar[None] = None
	"""Useful to send a custom element to the UI."""
	type: str = "custom"
	mime: str = APPLICATION_JSON
	
	def model_post_init(self, __context) -> None:
		self.content = json.dumps(self.props)
		super().model_post_init(__context)
		self.updatable = True

	async def update(self):
		await super().send(self.for_id)

# Simple mapping for type discrimination (Pyplot shares "image", so not included)
TYPE_MAP: Dict[str, Any] = {
	"image": Image,
	"text": Text,
	"pdf": Pdf,
	"tasklist": TaskList,
	"audio": Audio,
	"video": Video,
	"file": File,
	"plotly": Plotly,
	"dataframe": Dataframe,
	"custom": CustomElement,
}