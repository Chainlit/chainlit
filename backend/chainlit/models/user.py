from typing import Dict, Optional, Literal
from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
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

# Persisted user (for database use)
class PersistedUser(SQLModel, table=True):
	id: str = Field(primary_key=True)
	identifier: str
	display_name: Optional[str] = None
	metadata: Dict = Field(default_factory=dict)
	created_at: Optional[str] = None

	model_config = ConfigDict(
		alias_generator=to_camel,
		populate_by_name=True,
	)