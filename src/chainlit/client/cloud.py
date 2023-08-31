import asyncio
import uuid
from typing import Any, Dict, Mapping, Optional, Union, cast

import aiohttp
from python_graphql_client import GraphqlClient
from starlette.datastructures import Headers

from chainlit.client.base import MessageDict, UserDict
from chainlit.config import config
from chainlit.logger import logger

from .base import BaseAuthClient, BaseDBClient, PageInfo, PaginatedResponse, UserDict


class GraphQLClient:
    def __init__(self, project_id: str, access_token: Optional[str]):
        self.project_id = project_id

        self.headers = {"content-type": "application/json"}
        if access_token:
            self.headers["Authorization"] = access_token

        graphql_endpoint = f"{config.chainlit_server}/api/graphql"
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


class CloudAuthClient(BaseAuthClient, GraphQLClient):
    def __init__(
        self,
        project_id: str,
        handshake_headers: Optional[Dict[str, str]] = None,
        request_headers: Optional[Headers] = None,
    ):
        access_token = None

        if handshake_headers:
            access_token = handshake_headers.get("HTTP_AUTHORIZATION")
        elif request_headers:
            access_token = request_headers.get("Authorization")

        if access_token is None:
            raise ConnectionRefusedError("No access token provided")

        GraphQLClient.__init__(self, project_id, access_token)

    async def get_user_infos(
        self,
    ) -> UserDict:
        data = {"projectId": self.project_id}

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{config.chainlit_server}/api/me",
                json=data,
                headers=self.headers,
            ) as r:
                if not r.ok:
                    reason = await r.text()
                    raise ValueError(f"Failed to get user infos. {r.status}: {reason}")

                json = await r.json()
                self.user_infos = json
                # replace with unpacking when Mypy 1.5.0 is out:
                # return UserDict(**self.user_infos)
                return cast(UserDict, self.user_infos)

    async def is_project_member(self) -> bool:
        try:
            user = await self.get_user_infos()
            return user["role"] != "ANONYMOUS"
        except ValueError as e:
            logger.error(e)
            return False


class CloudDBClient(BaseDBClient, GraphQLClient):
    conversation_id: Optional[str] = None
    lock: asyncio.Lock

    def __init__(
        self,
        project_id: str,
        handshake_headers: Optional[Dict[str, str]] = None,
        request_headers: Optional[Headers] = None,
    ):
        self.lock = asyncio.Lock()

        access_token = None

        if handshake_headers:
            access_token = handshake_headers.get("HTTP_AUTHORIZATION")
        elif request_headers:
            access_token = request_headers.get("Authorization")

        if access_token is None:
            raise ConnectionRefusedError("No access token provided")

        super().__init__(project_id, access_token)

    async def create_user(self, variables: UserDict) -> bool:
        raise NotImplementedError

    async def get_project_members(self):
        query = """query ($projectId: String!) {
                    projectMembers(projectId: $projectId) {
                    edges {
                        cursor
                        node {
                        role
                        user {
                            email
                            name
                        }
                        }
                    }
                    }
                }"""
        variables = {"projectId": self.project_id}
        res = await self.query(query, variables)
        self.check_for_errors(res, raise_error=True)

        members = []

        for edge in res["data"]["projectMembers"]["edges"]:
            node = edge["node"]
            role = node["role"]
            name = node["user"]["name"]
            email = node["user"]["email"]
            members.append({"role": role, "name": name, "email": email})

        return members

    async def create_conversation(self) -> Optional[str]:
        # If we run multiple send concurrently, we need to make sure we don't create multiple conversations.
        async with self.lock:
            if self.conversation_id:
                return self.conversation_id

            mutation = """
            mutation ($projectId: String!, $sessionId: String) {
                createConversation(projectId: $projectId, sessionId: $sessionId) {
                    id
                }
            }
            """
            variables = {"projectId": self.project_id}
            res = await self.mutation(mutation, variables)

            if self.check_for_errors(res):
                logger.warning("Could not create conversation.")
                return None

            return res["data"]["createConversation"]["id"]

    async def get_conversation_id(self):
        self.conversation_id = await self.create_conversation()

        return self.conversation_id

    async def delete_conversation(self, conversation_id: str):
        mutation = """
        mutation ($id: ID!) {
            deleteConversation(id: $id) {
                id
            }
        }
        """
        variables = {"id": conversation_id}
        res = await self.mutation(mutation, variables)
        self.check_for_errors(res, raise_error=True)

        return True

    async def get_conversation(self, conversation_id: str):
        query = """
        query ($id: ID!) {
            conversation(id: $id) {
                id
                createdAt
                messages {
                    id
                    isError
                    parentId
                    indent
                    author
                    content
                    waitForAnswer
                    humanFeedback
                    language
                    prompt
                    authorIsUser
                    createdAt
                }
                elements {
                    id
                    conversationId
                    type
                    name
                    url
                    display
                    language
                    size
                    forIds
                }
            }
        }
        """
        variables = {
            "id": conversation_id,
        }
        res = await self.query(query, variables)
        self.check_for_errors(res, raise_error=True)

        return res["data"]["conversation"]

    async def get_conversations(self, pagination, filter):
        query = """query (
        $first: Int
        $projectId: String!
        $cursor: String
        $withFeedback: Int
        $authorEmail: String
        $search: String
    ) {
        conversations(
        first: $first
        cursor: $cursor
        projectId: $projectId
        withFeedback: $withFeedback
        authorEmail: $authorEmail
        search: $search
        ) {
        pageInfo {
            endCursor
            hasNextPage
        }
        edges {
            cursor
            node {
            id
            createdAt
            elementCount
            messageCount
            author {
                name
                email
            }
            messages {
                content
            }
            }
        }
        }
    }"""

        variables = {
            "projectId": self.project_id,
            "first": pagination.first,
            "cursor": pagination.cursor,
            "withFeedback": filter.feedback,
            "authorEmail": filter.authorEmail,
            "search": filter.search,
        }
        res = await self.query(query, variables)
        self.check_for_errors(res, raise_error=True)

        conversations = []

        for edge in res["data"]["conversations"]["edges"]:
            node = edge["node"]
            conversations.append(node)

        page_info = res["data"]["conversations"]["pageInfo"]

        return PaginatedResponse(
            pageInfo=PageInfo(
                hasNextPage=page_info["hasNextPage"],
                endCursor=page_info["endCursor"],
            ),
            data=conversations,
        )

    async def set_human_feedback(self, message_id, feedback):
        mutation = """mutation ($messageId: ID!, $humanFeedback: Int!) {
                        setHumanFeedback(messageId: $messageId, humanFeedback: $humanFeedback) {
                            id
                            humanFeedback
                    }
                }"""
        variables = {"messageId": message_id, "humanFeedback": feedback}
        res = await self.mutation(mutation, variables)
        self.check_for_errors(res, raise_error=True)

        return True

    async def get_message(self):
        raise NotImplementedError

    async def create_message(self, variables: MessageDict) -> Optional[str]:
        c_id = await self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the message.")
            return None

        variables["conversationId"] = c_id

        mutation = """
        mutation ($id: ID!, $conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: Json, $isError: Boolean, $parentId: String, $indent: Int, $authorIsUser: Boolean, $waitForAnswer: Boolean, $createdAt: StringOrFloat) {
            createMessage(id: $id, conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, isError: $isError, parentId: $parentId, indent: $indent, authorIsUser: $authorIsUser, waitForAnswer: $waitForAnswer, createdAt: $createdAt) {
                id
            }
        }
        """
        res = await self.mutation(mutation, variables)
        if self.check_for_errors(res):
            logger.warning("Could not create message.")
            return None

        return res["data"]["createMessage"]["id"]

    async def update_message(self, message_id: str, variables: MessageDict) -> bool:
        mutation = """
        mutation ($messageId: ID!, $author: String!, $content: String!, $parentId: String, $language: String, $prompt: Json) {
            updateMessage(messageId: $messageId, author: $author, content: $content, parentId: $parentId, language: $language,  prompt: $prompt) {
                id
            }
        }
        """
        res = await self.mutation(mutation, dict(messageId=message_id, **variables))

        if self.check_for_errors(res):
            logger.warning("Could not update message.")
            return False

        return True

    async def delete_message(self, message_id: str) -> bool:
        mutation = """
        mutation ($messageId: ID!) {
            deleteMessage(messageId: $messageId) {
                id
            }
        }
        """
        res = await self.mutation(mutation, {"messageId": message_id})

        if self.check_for_errors(res):
            logger.warning("Could not delete message.")
            return False

        return True

    async def get_element(self, conversation_id, element_id):
        query = """query (
        $conversationId: ID!
        $id: ID!
    ) {
        element(
        conversationId: $conversationId,
        id: $id
        ) {
        id
        conversationId
        type
        name
        url
        display
        language
        size
        forIds
        }
    }"""

        variables = {
            "conversationId": conversation_id,
            "id": element_id,
        }
        res = await self.query(query, variables)
        self.check_for_errors(res, raise_error=True)

        return res["data"]["element"]

    async def create_element(self, variables):
        c_id = await self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the element.")
            return None

        mutation = """
        mutation ($conversationId: ID!, $type: String!, $name: String!, $display: String!, $forIds: [String!]!, $url: String, $objectKey: String, $size: String, $language: String) {
            createElement(conversationId: $conversationId, type: $type, url: $url, objectKey: $objectKey, name: $name, display: $display, size: $size, language: $language, forIds: $forIds) {
                id,
                type,
                url,
                objectKey,
                name,
                display,
                size,
                language,
                forIds
            }
        }
        """
        variables["conversationId"] = c_id
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not create element.")
            return None

        return res["data"]["createElement"]

    async def update_element(self, variables):
        c_id = await self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the element.")
            return None

        mutation = """
        mutation ($conversationId: ID!, $id: ID!, $forIds: [String!]!) {
            updateElement(conversationId: $conversationId, id: $id, forIds: $forIds) {
                id,
            }
        }
        """

        variables = variables.copy()
        variables["conversationId"] = c_id
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not update element.")
            return None

        return res["data"]["updateElement"]

    async def upload_element(self, content: Union[bytes, str], mime: str) -> Dict:
        id = str(uuid.uuid4())
        body = {"projectId": self.project_id, "fileName": id, "contentType": mime}

        path = f"/api/upload/file"

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{config.chainlit_server}{path}",
                json=body,
                headers=self.headers,
            ) as r:
                if not r.ok:
                    reason = await r.text()
                    logger.error(f"Failed to upload file: {reason}")
                    return {"object_key": None, "url": None}
                json_res = await r.json()

        upload_details = json_res["post"]
        object_key = upload_details["fields"]["key"]
        signed_url = json_res["signedUrl"]

        form_data = aiohttp.FormData()

        # Add fields to the form_data
        for field_name, field_value in upload_details["fields"].items():
            form_data.add_field(field_name, field_value)

        # Add file to the form_data
        form_data.add_field("file", content, content_type="multipart/form-data")
        async with aiohttp.ClientSession() as session:
            async with session.post(
                upload_details["url"],
                data=form_data,
            ) as upload_response:
                if not upload_response.ok:
                    reason = await upload_response.text()
                    logger.error(f"Failed to upload file: {reason}")
                    return {"object_key": None, "url": None}

                url = f'{upload_details["url"]}/{object_key}'
                return {"object_key": object_key, "url": signed_url}
