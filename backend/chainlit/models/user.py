from typing import Dict, Optional, Literal
from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy import Column, JSON
import uuid
from chainlit.utils import utc_now

Provider = Literal[
	"credentials",
	"header",
	"github",
	"google",
	"azure-ad",
	"azure-ad-hybrid",
	"okta",
	"auth0",
	"descope",
]

# Non-persisted user (for runtime/session use)
class User(BaseModel):
	identifier: str
	display_name: Optional[str] = None
	metadata: Dict = Field(default_factory=dict)


class PersistedUser(SQLModel, table=True):
	__tablename__ = "users"

	id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
	identifier: str
	display_name: Optional[str] = None
	metadata_: Optional[dict] = Field(
		default_factory=dict,
		sa_column=Column("metadata", JSON),
		alias="metadata",
		schema_extra={"serialization_alias": "metadata"},
	)
	created_at: str = Field(default_factory=utc_now)

	model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)