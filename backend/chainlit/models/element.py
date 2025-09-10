from typing import Optional, Dict, List, Union, ClassVar, TypeVar, Any, Literal, get_args
from sqlmodel import SQLModel, Field
import uuid
from pydantic import ConfigDict
from pydantic.functional_validators import field_validator
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

mime_types: Dict[str, str] = {
	"text": "text/plain",
	"tasklist": APPLICATION_JSON,
	"plotly": APPLICATION_JSON,
}
class ElementBase(SQLModel):
	type: ElementType
	name: str = ""
	url: Optional[str] = None
	path: Optional[str] = None
	object_key: Optional[str] = None
	chainlit_key: Optional[str] = None
	display: ElementDisplay = "inline"
	size: Optional[ElementSize] = None
	language: Optional[str] = None
	mime: Optional[str] = None
	page: Optional[int] = None
	props: Optional[dict] = None
	auto_play: Optional[bool] = None
	player_config: Optional[dict] = None
	# runtime-only
	_content: Optional[Union[str, bytes]] = PrivateAttr(default=None)
	_persisted: bool = PrivateAttr(default=False)
	_updatable: bool = PrivateAttr(default=False)
	_bg_task: Any = PrivateAttr(default=None)

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

	def to_dict(self):
		return self.model_dump(by_alias=True)

	@classmethod
	def from_dict(cls, **kwargs):
		# Default to file if missing
		t = kwargs.get("type", "file")
		if t not in TYPE_MAP:
			t = "file"
		kwargs["type"] = t
		model = TYPE_MAP.get(t, File)
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

		def _resolve_mime(self) -> None:
			# Resolve MIME if needed
			if self.mime:
				return
			key = self.type
			if isinstance(key, str) and key in mime_types:
				self.mime = mime_types[key]
			elif self.path or isinstance(self.content, (bytes, bytearray)):
				file_type = filetype.guess(self.path or self.content)
				if file_type:
					self.mime = file_type.mime
			elif self.url:
				import mimetypes
				self.mime = mimetypes.guess_type(self.url)[0]

		async def _persist_file_if_needed(self) -> None:
			# Persist file if needed
			if self.url:
				return
			if not self.chainlit_key or getattr(self, "updatable", False) or self._updatable:
				file_dict = await context.session.persist_file(
					name=self.name,
					path=self.path,
					content=self.content,
					mime=self.mime or "",
				)
				self.chainlit_key = file_dict["id"]

		async def _create(self, persist: bool = True, for_id: Optional[str] = None) -> None:
			if self._persisted and not (getattr(self, "updatable", False) or self._updatable):
				return None

			self._resolve_mime()
			await self._persist_file_if_needed()

		data_layer = get_data_layer()
		if data_layer and persist:
			try:
				# Map to DB element and persist
				db_elem = Element.from_base(self, for_id=for_id)
				self._bg_task = asyncio.create_task(data_layer.create_element(db_elem))
			except Exception as e:
				logger.error(f"Failed to create element: {e!s}")

		self._persisted = True
		return None

	async def remove(self):
		data_layer = get_data_layer()
		if data_layer:
			await data_layer.delete_element(self.id, self.thread_id)
		await context.emitter.emit("remove_element", {"id": self.id})

	async def send(self, for_id: str, persist: bool = True):
		await self._create(persist=persist, for_id=for_id)

		if not self.url and not self.chainlit_key:
			raise ValueError("Must provide url or chainlit key to send element")

		await context.emitter.send_element(self.to_dict())
		
ElementBased = TypeVar("ElementBased", bound=ElementBase)

# Subclasses for runtime logic (not DB tables)
class Image(ElementBase):
	type: Literal["image"] = "image"
	size: Optional[ElementSize] = "medium"
	
class Text(ElementBase):
	type: Literal["text"] = "text"
	language: Optional[str] = None
	
class Pdf(ElementBase):
	type: Literal["pdf"] = "pdf"
	mime: str = "application/pdf"
	page: Optional[int] = None
	
class Pyplot(ElementBase):
	"""Useful to send a pyplot to the UI."""
	type: Literal["image"] = "image"
	size: Optional[ElementSize] = "medium"
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
		
class TaskList(ElementBase):
	type: Literal["tasklist"] = "tasklist"
	tasks: List[Task] = Field(default_factory=list, exclude=True)
	status: str = "Ready"
	name: str = "tasklist"
	
	def model_post_init(self, __context) -> None:
		super().model_post_init(__context)
		self._updatable = True
		setattr(self, "updatable", True)

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

class Audio(ElementBase):
	type: Literal["audio"] = "audio"
	auto_play: bool = False

class Video(ElementBase):
	type: Literal["video"] = "video"
	size: Optional[ElementSize] = "medium"
	
class File(ElementBase):
	type: Literal["file"] = "file"

class Plotly(ElementBase):
	type: Literal["plotly"] = "plotly"
	size: Optional[ElementSize] = "medium"
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

class Dataframe(ElementBase):
	type: Literal["dataframe"] = "dataframe"
	size: Optional[ElementSize] = "large"
	data: Any = Field(default=None, exclude=True)
	
	def model_post_init(self, __context) -> None:
		if hasattr(self, "data") and self.data is not None:
			from pandas import DataFrame
			if not isinstance(self.data, DataFrame):
				raise TypeError("data must be a pandas.DataFrame")
			self.content = self.data.to_json(orient="split", date_format="iso")
		super().model_post_init(__context)
	
class CustomElement(ElementBase):
	"""Useful to send a custom element to the UI."""
	type: Literal["custom"] = "custom"
	mime: str = APPLICATION_JSON
	
	def model_post_init(self, __context) -> None:
		self.content = json.dumps(self.props)
		super().model_post_init(__context)
		self._updatable = True
		setattr(self, "updatable", True)

	async def update(self):
		await super().send(for_id="")

# DB model with table=True
class Element(ElementBase, table=True):
	__tablename__ = "elements"

	id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
	thread_id: Optional[str] = Field(
		default=None,
		sa_column=Column(String, ForeignKey("threads.id", ondelete="CASCADE"), nullable=True),
	)
	for_id: Optional[str] = Field(
		default=None,
		sa_column=Column(String, ForeignKey("steps.id", ondelete="CASCADE"), nullable=True),
	)
	# Override Literal fields with DB-mappable types
	type: str = Field(..., nullable=False)
	display: str = Field(..., nullable=False)
	size: Optional[str] = None
	props: Optional[dict] = Field(default_factory=dict, sa_type=JSON)
	player_config: Optional[dict] = Field(default_factory=dict, sa_type=JSON)

	# Strict validation of DB fields using runtime Literal definitions
	@field_validator("type", mode="before")
	@classmethod
	def _validate_type(cls, v: Any) -> str:
		if v is None:
			raise ValueError("type is required")
		v_str = str(v)
		if v_str not in get_args(ElementType):
			raise ValueError(f"Invalid type: {v_str}")
		return v_str

	@field_validator("display", mode="before")
	@classmethod
	def _validate_display(cls, v: Any) -> str:
		if v is None:
			raise ValueError("display is required")
		v_str = str(v)
		if v_str not in get_args(ElementDisplay):
			raise ValueError(f"Invalid display: {v_str}")
		return v_str

	@field_validator("size", mode="before")
	@classmethod
	def _validate_size(cls, v: Any) -> Optional[str]:
		if v is None or v == "None":
			return None
		v_str = str(v)
		if v_str not in get_args(ElementSize):
			raise ValueError(f"Invalid size: {v_str}")
		return v_str

	@classmethod
	def from_base(cls, base: ElementBase, for_id: Optional[str] = None) -> "Element":
		return cls(
			type=str(base.type),
			name=base.name,
			url=base.url,
			path=base.path,
			object_key=base.object_key,
			chainlit_key=base.chainlit_key,
			display=str(base.display),
			size=str(base.size) if base.size is not None else None,
			language=base.language,
			mime=base.mime,
			page=base.page,
			props=base.props or {},
			auto_play=base.auto_play,
			player_config=base.player_config or {},
			for_id=for_id,
		)

	# Validators to enforce allowed values on the DB model
	@classmethod
	def _allowed(cls, lit) -> List[str]:
		return list(get_args(lit))

	@classmethod
	def _validate_choice(cls, value: Optional[str], lit) -> Optional[str]:
		if value is None:
			return value
		allowed = cls._allowed(lit)
		if value not in allowed:
			raise ValueError(f"Invalid value: {value}. Must be one of: {allowed}")
		return value

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