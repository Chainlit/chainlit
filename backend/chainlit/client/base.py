from typing import (
    Any,
    Dict,
    Generic,
    List,
    Literal,
    Mapping,
    Optional,
    TypedDict,
    TypeVar,
)

from chainlit.logger import logger
from chainlit.prompt import Prompt
from dataclasses_json import DataClassJsonMixin
from pydantic import BaseModel, Field
from pydantic.dataclasses import dataclass
from python_graphql_client import GraphqlClient

ElementType = Literal[
    "image", "avatar", "text", "pdf", "tasklist", "audio", "video", "file"
]
ElementDisplay = Literal["inline", "side", "page"]
ElementSize = Literal["small", "medium", "large"]

Role = Literal["USER", "ADMIN", "OWNER", "ANONYMOUS"]
Provider = Literal[
    "credentials", "header", "github", "google", "azure-ad", "okta", "auth0"
]


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


class MessageDict(TypedDict):
    conversationId: Optional[str]
    id: str
    createdAt: Optional[int]
    content: str
    author: str
    prompt: Optional[Prompt]
    language: Optional[str]
    parentId: Optional[str]
    indent: Optional[int]
    authorIsUser: Optional[bool]
    waitForAnswer: Optional[bool]
    isError: Optional[bool]
    humanFeedback: Optional[int]
    disableHumanFeedback: Optional[bool]


class ElementDict(TypedDict):
    id: str
    conversationId: Optional[str]
    type: ElementType
    url: str
    objectKey: Optional[str]
    name: str
    display: ElementDisplay
    size: Optional[ElementSize]
    language: Optional[str]
    forIds: Optional[List[str]]


class ConversationDict(TypedDict):
    id: Optional[str]
    createdAt: Optional[int]
    elementCount: Optional[int]
    messageCount: Optional[int]
    appUser: Optional[AppUser]
    messages: List[MessageDict]
    elements: Optional[List[ElementDict]]


@dataclass
class PageInfo:
    hasNextPage: bool
    endCursor: Optional[str]


T = TypeVar("T")


@dataclass
class PaginatedResponse(DataClassJsonMixin, Generic[T]):
    pageInfo: PageInfo
    data: List[T]


class Pagination(BaseModel):
    first: int
    cursor: Optional[str]


class ConversationFilter(BaseModel):
    feedback: Optional[Literal[-1, 0, 1]]
    username: Optional[str]
    search: Optional[str]


class ChainlitGraphQLClient:
    def __init__(self, api_key: str, chainlit_server: str):
        self.headers = {"content-type": "application/json"}
        if api_key:
            self.headers["x-api-key"] = api_key
        else:
            raise ValueError("Cannot instantiate Cloud Client without CHAINLIT_API_KEY")

        graphql_endpoint = f"{chainlit_server}/api/graphql"
        self.graphql_client = GraphqlClient(
            endpoint=graphql_endpoint, headers=self.headers
        )

    async def query(self, query: str, variables: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Execute a GraphQL query.

        :param query: The GraphQL query string.
        :param variables: A dictionary of variables for the query.
        :return: The response data as a dictionary.
        """
        return await self.graphql_client.execute_async(query=query, variables=variables)

    def check_for_errors(self, response: Dict[str, Any], raise_error: bool = False):
        if "errors" in response:
            if raise_error:
                raise Exception(response["errors"][0])
            logger.error(response["errors"][0])
            return True
        return False

    async def mutation(
        self, mutation: str, variables: Mapping[str, Any] = {}
    ) -> Dict[str, Any]:
        """
        Execute a GraphQL mutation.

        :param mutation: The GraphQL mutation string.
        :param variables: A dictionary of variables for the mutation.
        :return: The response data as a dictionary.
        """
        return await self.graphql_client.execute_async(
            query=mutation, variables=variables
        )
