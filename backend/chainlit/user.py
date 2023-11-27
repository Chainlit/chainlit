from typing import List, Literal, Optional, TypedDict

from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import Field, dataclass

Role = Literal["USER", "ADMIN", "OWNER", "ANONYMOUS"]
Provider = Literal[
    "credentials", "header", "github", "google", "azure-ad", "okta", "auth0", "descope"
]


class AppUserDict(TypedDict):
    id: str
    username: str


# Used when logging-in a user
@dataclass
class AppUser(DataClassJsonMixin):
    username: str
    role: Role = "USER"
    tags: List[str] = Field(default_factory=list)
    image: Optional[str] = None
    provider: Optional[Provider] = None


@dataclass
class PersistedAppUserFields:
    id: str
    createdAt: int


@dataclass
class PersistedAppUser(AppUser, PersistedAppUserFields):
    pass
