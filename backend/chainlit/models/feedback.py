from typing import Dict, Optional, Literal
from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

FeedbackStrategy = Literal["BINARY"]

class Feedback(SQLModel, table=True):
	id: Optional[str] = Field(default=None, primary_key=True)
	for_id: str
	value: Literal[0, 1]
	thread_id: Optional[str] = None
	comment: Optional[str] = None

	model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)

	def to_dict(self):
		data = self.model_dump(by_alias=True)
		data.pop("threadId", None)
		return data

class UpdateFeedbackRequest(BaseModel):
	feedback: Feedback
	session_id: str
	
class DeleteFeedbackRequest(BaseModel):
    feedbackId: str
