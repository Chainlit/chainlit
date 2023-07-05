from typing import Dict, Any, Optional
import uuid

import asyncio
import aiohttp
from python_graphql_client import GraphqlClient

from chainlit.client.base import UserDict

from .base import BaseDBClient, BaseAuthClient, PaginatedResponse, PageInfo, UserDict

from chainlit.logger import logger
from chainlit.config import config


class GraphQLClient:
    def __init__(self, project_id: str, access_token: str):
        self.project_id = project_id
        self.headers = {
            "Authorization": access_token,
            "content-type": "application/json",
        }
        graphql_endpoint = f"{config.chainlit_server}/api/graphql"
        self.graphql_client = GraphqlClient(
            endpoint=graphql_endpoint, headers=self.headers
        )

    def query(self, query: str, variables: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Execute a GraphQL query.

        :param query: The GraphQL query string.
        :param variables: A dictionary of variables for the query.
        :return: The response data as a dictionary.
        """
        return self.graphql_client.execute_async(query=query, variables=variables)

    def check_for_errors(self, response: Dict[str, Any], raise_error: bool = False):
        if "errors" in response:
            if raise_error:
                raise Exception(response["errors"][0])
            logger.error(response["errors"][0])
            return True
        return False

    def mutation(self, mutation: str, variables: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Execute a GraphQL mutation.

        :param mutation: The GraphQL mutation string.
        :param variables: A dictionary of variables for the mutation.
        :return: The response data as a dictionary.
        """
        return self.graphql_client.execute_async(query=mutation, variables=variables)


class CloudAuthClient(BaseAuthClient, GraphQLClient):
    def __init__(self, project_id: str, access_token: str):
        super().__init__(project_id, access_token)

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
                return self.user_infos

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

    def __init__(self, project_id: str, access_token: str):
        self.lock = asyncio.Lock()
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

    async def create_conversation(self) -> int:
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

            return int(res["data"]["createConversation"]["id"])

    async def get_conversation_id(self):
        self.conversation_id = await self.create_conversation()

        return self.conversation_id

    async def delete_conversation(self, conversation_id: int):
        mutation = """mutation ($id: ID!) {
    deleteConversation(id: $id) {
      id
    }
  }"""
        variables = {"id": conversation_id}
        res = await self.mutation(mutation, variables)
        self.check_for_errors(res, raise_error=True)

        return True

    async def get_conversation(self, conversation_id: int):
        query = """query ($id: ID!) {
    conversation(id: $id) {
      id
      createdAt
      messages {
        id
        isError
        indent
        author
        content
        waitForAnswer
        humanFeedback
        language
        prompt
        llmSettings
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
  }"""
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

    async def create_message(self, variables: Dict[str, Any]) -> int:
        c_id = await self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the message.")
            return None

        variables["conversationId"] = c_id

        mutation = """
        mutation ($conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json, $isError: Boolean, $indent: Int, $authorIsUser: Boolean, $waitForAnswer: Boolean, $createdAt: StringOrFloat) {
            createMessage(conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, llmSettings: $llmSettings, isError: $isError, indent: $indent, authorIsUser: $authorIsUser, waitForAnswer: $waitForAnswer, createdAt: $createdAt) {
                id
            }
        }
        """
        res = await self.mutation(mutation, variables)
        if self.check_for_errors(res):
            logger.warning("Could not create message.")
            return None

        return int(res["data"]["createMessage"]["id"])

    async def update_message(self, message_id: int, variables: Dict[str, Any]) -> bool:
        mutation = """
        mutation ($messageId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json) {
            updateMessage(messageId: $messageId, author: $author, content: $content, language: $language, prompt: $prompt, llmSettings: $llmSettings) {
                id
            }
        }
        """
        variables["messageId"] = message_id
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not update message.")
            return False

        return True

    async def delete_message(self, message_id: int) -> bool:
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

    async def upsert_element(self, variables):
        c_id = await self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the element.")
            return None

        if "id" in variables:
            mutation_name = "updateElement"
            mutation = """
            mutation ($conversationId: ID!, $id: ID!, $forIds: [String!]!) {
                updateElement(conversationId: $conversationId, id: $id, forIds: $forIds) {
                    id,
                }
            }
            """
            variables["conversationId"] = c_id
            res = await self.mutation(mutation, variables)
        else:
            mutation_name = "createElement"
            mutation = """
            mutation ($conversationId: ID!, $type: String!, $url: String!, $name: String!, $display: String!, $forIds: [String!]!, $size: String, $language: String) {
                createElement(conversationId: $conversationId, type: $type, url: $url, name: $name, display: $display, size: $size, language: $language, forIds: $forIds) {
                    id,
                    type,
                    url,
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
            logger.warning("Could not persist element.")
            return None

        return res["data"][mutation_name]

    async def upload_element(self, content: bytes, mime: str) -> str:
        id = f"{uuid.uuid4()}"
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
                    return ""
                json_res = await r.json()

        upload_details = json_res["post"]
        permanent_url = json_res["permanentUrl"]

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
                    return ""

                url = f'{upload_details["url"]}/{upload_details["fields"]["key"]}'
                return permanent_url
