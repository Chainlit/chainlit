
from typing import  Dict, Generic, List, Optional, TypeVar, Self
from sqlmodel import SQLModel, Field
from pydantic import PrivateAttr, BaseModel
import uuid
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy import Column, JSON, ForeignKey, String


class ThreadBase(SQLModel):
	created_at: Optional[str] = None
	name: Optional[str] = None
	user_id: Optional[str] = None
	user_identifier: Optional[str] = None
	tags: Optional[List[str]] = None
	# Persisted as JSON column named "metadata", but exposed as `metadata` in the API
	metadata_: Optional[dict] = Field(
		default_factory=dict,
		alias="metadata",
		sa_column=Column("metadata", JSON),
		schema_extra={"serialization_alias": "metadata"},
	)

	model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)

	# Private runtime attributes
	_steps: Optional[List] = None
	_elements: Optional[List] = None
	_runtime_state: dict = PrivateAttr(default_factory=dict)

	def add_tag(self, tag: str):
		if self.tags is None:
			self.tags = []
		if tag not in self.tags:
			self.tags.append(tag)

	def to_dict(self):
		return self.model_dump(by_alias=True)

	@classmethod
	def from_dict(cls, **kwargs) -> Self:
		return cls.model_validate(**kwargs)


class Thread(ThreadBase, table=True):
	__tablename__ = "threads"

	id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
	user_id: Optional[str] = Field(
		default=None,
		sa_column=Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
	)
	tags: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSON))


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
		# Without runtime type info for T, return data as-is
		data_list = paginated_response_dict.get("data", [])
		return cls(page_info=page_info, data=data_list)

# Thread requests/responses
class UpdateThreadRequest(BaseModel):
	thread_id: str
	name: str

class DeleteThreadRequest(BaseModel):
	thread_id: str

class GetThreadsRequest(BaseModel):
	pagination: Pagination
	filter: ThreadFilter
