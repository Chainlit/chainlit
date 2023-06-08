from typing import Dict, Any, Optional
from python_graphql_client import GraphqlClient
from abc import ABC, abstractmethod
import uuid
import requests
from chainlit.types import ElementType, ElementSize
from chainlit.logger import logger
from chainlit.config import config


class BaseClient(ABC):
    project_id: str
    session_id: str

    @abstractmethod
    def is_project_member(self, access_token: str) -> bool:
        pass

    @abstractmethod
    def create_conversation(self, session_id: str) -> int:
        pass

    @abstractmethod
    def create_message(self, variables: Dict[str, Any]) -> int:
        pass

    @abstractmethod
    def update_message(self, message_id: int, variables: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    def delete_message(self, message_id: int) -> bool:
        pass

    @abstractmethod
    def upload_element(self, content: bytes, mime: str) -> int:
        pass

    @abstractmethod
    def create_element(
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


class CloudClient(BaseClient):
    conversation_id: Optional[str] = None

    def __init__(self, project_id: str, session_id: str, access_token: str, url: str):
        self.project_id = project_id
        self.session_id = session_id
        self.url = url
        self.headers = {"Authorization": access_token}
        graphql_endpoint = f"{url}/api/graphql"
        self.client = GraphqlClient(endpoint=graphql_endpoint, headers=self.headers)

    def query(self, query: str, variables: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Execute a GraphQL query.

        :param query: The GraphQL query string.
        :param variables: A dictionary of variables for the query.
        :return: The response data as a dictionary.
        """
        return self.client.execute(query=query, variables=variables)

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
        return self.client.execute(query=mutation, variables=variables)

    def is_project_member(self) -> bool:
        try:
            headers = {
                "content-type": "application/json",
                "Authorization": self.headers["Authorization"],
            }
            data = {"projectId": self.project_id}
            response = requests.post(
                f"{config.chainlit_server}/api/role", headers=headers, json=data
            )

            role = response.json().get("role", "ANONYMOUS")
            return role != "ANONYMOUS"
        except Exception as e:
            logger.exception(e)
            return False

    def create_conversation(self, session_id: str) -> int:
        mutation = """
        mutation ($projectId: String!, $sessionId: String!) {
            createConversation(projectId: $projectId, sessionId: $sessionId) {
                id
            }
        }
        """
        variables = {"projectId": self.project_id, "sessionId": session_id}
        res = self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not create conversation.")
            return None

        return int(res["data"]["createConversation"]["id"])

    def get_conversation_id(self):
        if not self.conversation_id:
            self.conversation_id = self.create_conversation(self.session_id)

        return self.conversation_id

    def create_message(self, variables: Dict[str, Any]) -> int:
        c_id = self.get_conversation_id()

        if not c_id:
            logger.warning("Missing conversation ID, could not persist the message.")
            return None

        variables["conversationId"] = c_id

        mutation = """
        mutation ($conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json, $isError: Boolean, $indent: Int, $authorIsUser: Boolean, $waitForAnswer: Boolean) {
            createMessage(conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, llmSettings: $llmSettings, isError: $isError, indent: $indent, authorIsUser: $authorIsUser, waitForAnswer: $waitForAnswer) {
                id
            }
        }
        """
        res = self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not create message.")
            return None

        return int(res["data"]["createMessage"]["id"])

    def update_message(self, message_id: int, variables: Dict[str, Any]) -> bool:
        mutation = """
        mutation ($messageId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json) {
            updateMessage(messageId: $messageId, author: $author, content: $content, language: $language, prompt: $prompt, llmSettings: $llmSettings) {
                id
            }
        }
        """
        variables["messageId"] = message_id
        res = self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not update message.")
            return False

        return True

    def delete_message(self, message_id: int) -> bool:
        mutation = """
        mutation ($messageId: ID!) {
            deleteMessage(messageId: $messageId) {
                id
            }
        }
        """
        res = self.mutation(mutation, {"messageId": message_id})

        if self.check_for_errors(res):
            logger.warning("Could not delete message.")
            return False

        return True

    def create_element(
        self,
        type: ElementType,
        url: str,
        name: str,
        display: str,
        size: ElementSize = None,
        language: str = None,
        for_id: str = None,
    ) -> Dict[str, Any]:
        c_id = self.get_conversation_id()

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
        res = self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not persist element.")
            return None

        return res["data"]["createElement"]

    def upload_element(self, content: bytes, mime: str) -> str:
        id = f"{uuid.uuid4()}"
        url = f"{self.url}/api/upload/file"
        body = {"projectId": self.project_id, "fileName": id}
        if mime:
            body["contentType"] = mime

        res = requests.post(url, json=body, headers=self.headers)

        if not res.ok:
            logger.error(f"Failed to upload file: {res.text}")
            return ""

        json_res = res.json()
        upload_details = json_res["post"]
        permanent_url = json_res["permanentUrl"]

        files = {"file": content}

        upload_response = requests.post(
            upload_details["url"],
            data=upload_details["fields"],
            files=files,
        )

        if not upload_response.ok:
            logger.error(f"Failed to upload file: {upload_response.text}")
            return ""

        url = f'{upload_details["url"]}/{upload_details["fields"]["key"]}'
        return permanent_url
