from typing import Dict, Any
from python_graphql_client import GraphqlClient
from abc import ABC, abstractmethod
import uuid
import requests
from chainlit.types import DocumentType


class BaseClient(ABC):
    project_id: str

    @abstractmethod
    def create_conversation(self, session_id: str) -> int:
        pass

    @abstractmethod
    def create_message(self, variables: Dict[str, Any]) -> int:
        pass

    @abstractmethod
    def upload_document(self, ext: str, content: bytes) -> int:
        pass

    @abstractmethod
    def create_document(self, conversation_id: str, type: DocumentType, url: str, name: str, display: str) -> int:
        pass

class CloudClient(BaseClient):
    def __init__(self, project_id: str, access_token: str, url: str):
        self.project_id = project_id
        self.url = url
        self.headers = {
            "Authorization": access_token
        }
        graphql_endpoint = f'{url}/api/graphql'
        self.client = GraphqlClient(
            endpoint=graphql_endpoint, headers=self.headers)

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
        return int(res['data']['createConversation']["id"])

    def create_message(self, variables: Dict[str, Any]) -> int:
        mutation = """
        mutation ($conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json, $final: Boolean, $isError: Boolean, $indent: Int, $authorIsUser: Boolean, $waitForAnswer: Boolean) {
            createMessage(conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, llmSettings: $llmSettings, final: $final, isError: $isError, indent: $indent, authorIsUser: $authorIsUser, waitForAnswer: $waitForAnswer) {
                id
            }
        }
        """
        res = self.mutation(mutation, variables)
        return int(res['data']['createMessage']["id"])

    def create_document(self, conversation_id: str, type: DocumentType, url: str, name: str, display: str) -> Dict[str, Any]:
        mutation = """
        mutation ($conversationId: ID!, $type: String!, $url: String!, $name: String!, $display: String!) {
            createDocument(conversationId: $conversationId, type: $type, url: $url, name: $name, display: $display) {
                id,
                type,
                url,
                name,
                display
            }
        }
        """
        variables = {
            "conversationId": conversation_id,
            "type": type,
            "url": url,
            "name": name,
            "display": display
        }
        res = self.mutation(mutation, variables)
        return res['data']['createDocument']

    def upload_document(self, ext: str, content: bytes) -> str:
        id = f'{uuid.uuid4()}{ext}'
        url = f'{self.url}/api/upload'
        body = {'projectId': self.project_id, 'fileName': id}

        res = requests.post(url, json=body, headers=self.headers)
        upload_details = res.json()
        files = {'file': content}

        upload_response = requests.post(
            upload_details['url'], data=upload_details['fields'], files=files)
        if not upload_response.ok:
            return False

        url = f'{upload_details["url"]}/{upload_details["fields"]["key"]}'
        return url
