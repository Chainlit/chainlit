
from typing import TYPE_CHECKING, Any, Dict, Generic, List, Literal, Optional, Protocol, TypeVar, Union, Self
from sqlmodel import SQLModel, Field
from pydantic import PrivateAttr, BaseModel
import uuid
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy import Column, JSON

if TYPE_CHECKING:
	from chainlit.element import ElementDict
	from chainlit.step import StepDict

# Unified thread model
class Thread(SQLModel, table=True):
	id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
	created_at: str = ""
	name: Optional[str] = None
	user_id: Optional[str] = None
	user_identifier: Optional[str] = None
	tags: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSON))
	metadata_: Optional[dict] = Field(default_factory=dict, sa_column=Column('metadata', JSON), alias='metadata')
	
	model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)

	# Private attributes for business logic (not persisted or serialized)
	_steps: Optional[List] = None  # You can specify List[Step] if imported
	_elements: Optional[List] = None  # You can specify List[Element] if imported
	_runtime_state: dict = PrivateAttr(default_factory=dict)

	# Example business logic method
	def add_tag(self, tag: str):
		if tag not in self.tags:
			self.tags.append(tag)

	def to_dict(self):
		return self.model_dump(by_alias=True)

	@classmethod
	def from_dict(cls, **kwargs) -> Self:
		return cls.model_validate(**kwargs)


# Pagination and ThreadFilter
class Pagination(BaseModel):
	first: int
	cursor: Optional[str] = None

class ThreadFilter(BaseModel):
	feedback: Optional[int] = None
	user_id: Optional[str] = None
	search: Optional[str] = None


class PageInfo(BaseModel):
    hasNextPage: bool
    startCursor: Optional[str]
    endCursor: Optional[str]

    def to_dict(self):
        return self.model_dump()

    @classmethod
    def from_dict(cls, page_info_dict: Dict) -> Self:
        return cls(**page_info_dict)

T = TypeVar("T", covariant=True)
class PaginatedResponse(BaseModel, Generic[T]):
	page_info: PageInfo
	data: List[T]

	def to_dict(self):
		return self.model_dump()

	@classmethod
	def from_dict(
		cls, paginated_response_dict: Dict
	) -> "PaginatedResponse[T]":
		page_info = PageInfo.from_dict(paginated_response_dict.get("page_info", {}))
		data = [the_class.from_dict(d) for d in paginated_response_dict.get("data", [])]
		return cls(page_info=page_info, data=data)

# Thread requests/responses
class UpdateThreadRequest(BaseModel):
	thread_id: str
	name: str

class DeleteThreadRequest(BaseModel):
	thread_id: str

class GetThreadsRequest(BaseModel):
	pagination: Pagination
	filter: ThreadFilter
