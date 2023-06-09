from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
import uuid

import asyncio
import aiohttp
from python_graphql_client import GraphqlClient

from chainlit.types import ElementType, ElementSize
from chainlit.logger import logger
from chainlit.config import config


class BaseClient(ABC):
    project_id: str
    session_id: str

    @abstractmethod
    async def is_project_member(self, access_token: str) -> bool:
        pass

    @abstractmethod
    async def create_conversation(self, session_id: str) -> int:
        pass

    @abstractmethod
    async def create_message(self, variables: Dict[str, Any]) -> int:
        pass

    @abstractmethod
    async def update_message(self, message_id: int, variables: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    async def delete_message(self, message_id: int) -> bool:
        pass

    @abstractmethod
    async def upload_element(self, content: bytes, mime: str) -> str:
        pass

    @abstractmethod
    async def create_element(
        self,
        type: ElementType,
        url: str,
        name: str,
        display: str,
        size: ElementSize = None,
        language: str = None,
        for_id: str = None,
    ) -> Dict[str, Any]:
        pass


conversation_lock = asyncio.Lock()


class CloudClient(BaseClient):
    conversation_id: Optional[str] = None

    def __init__(self, project_id: str, session_id: str, access_token: str):
        self.project_id = project_id
        self.session_id = session_id
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

    def check_for_errors(self, response: Dict[str, Any]):
        if "errors" in response:
            logger.error(response["errors"])
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

    async def is_project_member(self) -> bool:
        data = {"projectId": self.project_id}
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{config.chainlit_server}/api/role",
                json=data,
                headers=self.headers,
            ) as r:
                if not r.ok:
                    reason = await r.text()
                    logger.error(f"Failed to get user role. {r.status}: {reason}")
                    return False
                json = await r.json()
                role = json.get("role", "ANONYMOUS")
                return role != "ANONYMOUS"

    async def create_conversation(self, session_id: str) -> int:
        # If we run multiple send concurrently, we need to make sure we don't create multiple conversations.
        async with conversation_lock:
            if self.conversation_id:
                return self.conversation_id

            mutation = """
            mutation ($projectId: String!, $sessionId: String!) {
                createConversation(projectId: $projectId, sessionId: $sessionId) {
                    id
                }
            }
            """
            variables = {"projectId": self.project_id, "sessionId": session_id}
            res = await self.mutation(mutation, variables)

            if self.check_for_errors(res):
                logger.warning("Could not create conversation.")
                return None

            return int(res["data"]["createConversation"]["id"])

    async def get_conversation_id(self):
        self.conversation_id = await self.create_conversation(self.session_id)

        return self.conversation_id

    async def create_message(self, variables: Dict[str, Any]) -> int:
        c_id = await self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the message.")
            return None

        variables["conversationId"] = c_id

        mutation = """
        mutation ($conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json, $isError: Boolean, $indent: Int, $authorIsUser: Boolean, $waitForAnswer: Boolean, $createdAt: Float) {
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

    async def create_element(
        self,
        type: ElementType,
        url: str,
        name: str,
        display: str,
        size: ElementSize = None,
        language: str = None,
        for_id: str = None,
    ) -> Dict[str, Any]:
        c_id = await self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the element.")
            return None

        mutation = """
        mutation ($conversationId: ID!, $type: String!, $url: String!, $name: String!, $display: String!, $size: String, $language: String, $forId: String) {
            createElement(conversationId: $conversationId, type: $type, url: $url, name: $name, display: $display, size: $size, language: $language, forId: $forId) {
                id,
                type,
                url,
                name,
                display,
                size,
                language,
                forId
            }
        }
        """
        variables = {
            "conversationId": c_id,
            "type": type,
            "url": url,
            "name": name,
            "display": display,
            "size": size,
            "language": language,
            "forId": for_id,
        }
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not persist element.")
            return None

        return res["data"]["createElement"]

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
