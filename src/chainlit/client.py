from typing import Dict, Any
from python_graphql_client import GraphqlClient
from abc import ABC, abstractmethod
import uuid
import requests
from chainlit.types import ElementType
from chainlit.logger import logger


class BaseClient(ABC):
    project_id: str
    session_id: str

    @abstractmethod
    def create_conversation(self, session_id: str) -> int:
        pass

    @abstractmethod
    def create_message(self, variables: Dict[str, Any]) -> int:
        pass

    @abstractmethod
    def upload_element(self, content: bytes) -> int:
        pass

    @abstractmethod
    def create_element(
        self,
        type: ElementType,
        url: str,
        name: str,
        display: str,
        for_id: str = None,
    ) -> Dict[str, Any]:
        pass


class CloudClient(BaseClient):
    conversation_id: str = None

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

    def mutation(self, mutation: str, variables: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Execute a GraphQL mutation.

        :param mutation: The GraphQL mutation string.
        :param variables: A dictionary of variables for the mutation.
        :return: The response data as a dictionary.
        """
        return self.client.execute(query=mutation, variables=variables)

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
        # Todo check response
        return int(res["data"]["createConversation"]["id"])

    def get_conversation_id(self):
        if not self.conversation_id:
            self.conversation_id = self.create_conversation(self.session_id)

        return self.conversation_id

    def create_message(self, variables: Dict[str, Any]) -> int:
        c_id = self.get_conversation_id()
        variables["conversationId"] = c_id

        mutation = """
        mutation ($conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json, $isError: Boolean, $indent: Int, $authorIsUser: Boolean, $waitForAnswer: Boolean) {
            createMessage(conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, llmSettings: $llmSettings, isError: $isError, indent: $indent, authorIsUser: $authorIsUser, waitForAnswer: $waitForAnswer) {
                id
            }
        }
        """
        res = self.mutation(mutation, variables)
        return int(res["data"]["createMessage"]["id"])

    def create_element(
        self, type: ElementType, url: str, name: str, display: str, for_id: str = None
    ) -> Dict[str, Any]:
        c_id = self.get_conversation_id()

        mutation = """
        mutation ($conversationId: ID!, $type: String!, $url: String!, $name: String!, $display: String!, $forId: String) {
            createElement(conversationId: $conversationId, type: $type, url: $url, name: $name, display: $display, forId: $forId) {
                id,
                type,
                url,
                name,
                display,
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
            "forId": for_id,
        }
        res = self.mutation(mutation, variables)
        return res["data"]["createElement"]

    def upload_element(self, content: bytes) -> str:
        id = f"{uuid.uuid4()}"
        url = f"{self.url}/api/upload/file"
        body = {"projectId": self.project_id, "fileName": id}

        res = requests.post(url, json=body, headers=self.headers)

        if not res.ok:
            logger.error(f"Failed to upload file: {res.text}")
            return ""

        json_res = res.json()
        upload_details = json_res["post"]
        permanent_url = json_res["permanentUrl"]

        files = {"file": content}

        upload_response = requests.post(
            upload_details["url"], data=upload_details["fields"], files=files
        )

        if not upload_response.ok:
            logger.error(f"Failed to upload file: {res.text}")
            return ""

        url = f'{upload_details["url"]}/{upload_details["fields"]["key"]}'
        return permanent_url
