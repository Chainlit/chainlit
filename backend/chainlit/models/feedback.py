from typing import Optional, Literal
from sqlmodel import SQLModel, Field
from pydantic import BaseModel, field_validator, ConfigDict
from pydantic.alias_generators import to_camel
import uuid
from sqlalchemy import Column, ForeignKey, String

FeedbackStrategy = Literal["BINARY"]


class FeedbackBase(SQLModel):
	for_id: str
	value: int
	thread_id: Optional[str] = None
	comment: Optional[str] = None

	model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)

	@field_validator("value", mode="before")
	@classmethod
	def validate_value(cls, v):
		allowed = [0, 1]
		if v not in allowed:
			raise ValueError(f"Invalid value: {v}. Must be one of: {allowed}")
		return v

	def to_dict(self):
		data = self.model_dump(by_alias=True)
		return data


class Feedback(FeedbackBase, table=True):
	__tablename__ = "feedbacks"

	id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
	for_id: str = Field(
		sa_column=Column(String, ForeignKey("steps.id", ondelete="CASCADE"))
	)
	value: int = Field(..., ge=0, le=1)
	comment: Optional[str] = None


class UpdateFeedbackRequest(BaseModel):
	feedback: Feedback
	session_id: str


class DeleteFeedbackRequest(BaseModel):
	feedbackId: str
