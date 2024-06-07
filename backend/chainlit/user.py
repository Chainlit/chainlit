from typing import Dict, Literal, TypedDict

from dataclasses_json import DataClassJsonMixin
from pydantic.dataclasses import Field, dataclass

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


class UserDict(TypedDict):
    id: str
    identifier: str
    metadata: Dict


# Used when logging-in a user
@dataclass
class User(DataClassJsonMixin):
    identifier: str
    metadata: Dict = Field(default_factory=dict)


@dataclass
class PersistedUserFields:
    id: str
    createdAt: str


@dataclass
class PersistedUser(User, PersistedUserFields):
    pass
