from python_graphql_client import GraphqlClient
from abc import ABC, abstractmethod
import json
import uuid
from prisma.models import Message, Conversation
import requests
from typing import Any
from chainlit.types import DocumentType


class BaseClient(ABC):
    project_id: str

    @abstractmethod
    def create_conversation(self, session_id: str) -> int:
        pass

    @abstractmethod
    def create_message(self, variables: dict) -> int:
        pass

    @abstractmethod
    def upload_document(self, ext: str, content: bytes) -> int:
        pass

    @abstractmethod
    def create_document(self, conversation_id: str, type: DocumentType, url: str, name: str, display: str) -> int:
        pass


conversations_query = """query ($first: Int, $after: ID, $projectId: String!) {
    conversations(first: $first, after: $after, projectId: $projectId) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          createdAt
          author {
            name,
            email
          }
        messages {
            id
            author
            content
            createdAt
            language
            prompt
            llmSettings
            final
            isError
            indent
        }
        }
      }
    }
  }
`;"""


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

    def query(self, query, variables={}):
        return self.client.execute(query=query, variables=variables)

    def mutation(self, mutation, variables={}):
        return self.client.execute(query=mutation, variables=variables)

    def create_conversation(self, session_id: str):
        mutation = """mutation ($projectId: String!, $sessionId: String!) {
            createConversation(projectId: $projectId, sessionId: $sessionId) {
                id
            }
        }"""
        variables = {"projectId": self.project_id, "sessionId": session_id}
        res = self.mutation(mutation, variables)
        return int(res['data']['createConversation']["id"])

    def create_message(self, variables: dict):
        mutation = """mutation ($conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: String, $llmSettings: Json, $final: Boolean, $isError: Boolean, $indent: Int) {
            createMessage(conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, llmSettings: $llmSettings, final: $final, isError: $isError, indent: $indent) {
                id
            }
        }"""
        res = self.mutation(mutation, variables)
        return int(res['data']['createMessage']["id"])

    def create_document(self, conversation_id: str, type: DocumentType, url: str, name: str, display: str):
        mutation = """mutation ($conversationId: ID!, $type: String!, $url: String!, $name: String!, $display: String!) {
            createDocument(conversationId: $conversationId, type: $type, url: $url, name: $name, display: $display) {
                id,
                type,
                url,
                name,
                display
            }
        }"""
        variables = {
            "conversationId": conversation_id,
            "type": type,
            "url": url,
            "name": name,
            "display": display
        }
        res = self.mutation(mutation, variables)
        return res['data']['createDocument']

    def upload_document(self, ext: str, content: bytes):
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

    # def get_conversations(self, project_id: str, first: int = None, after: int = None) -> int:
    #     variables = {"projectId": project_id, "first": first, "after": after}
    #     res = self.query(conversations_query, variables)
    #     return res['data']['conversations']


class LocalClient(BaseClient):
    def __init__(self, project_id: str):
        self.project_id = project_id

    def create_message(self, msg: dict):
        msg = msg.copy()
        if "llmSettings" in msg:
            msg["llmSettings"] = json.dumps(msg["llmSettings"])
        res = Message.prisma().create(data=msg)
        return res.id

    def create_conversation(self, session_id: str):
        res = Conversation.prisma().create(
            data={"projectId": self.project_id, "sessionId": session_id})
        return res.id

    def upload_document(self, name: str, file_name: str, content: Any) -> int:
        return super().upload_document(name, content, file_name)

    # def get_conversations(self, project_id: str, first: int = None, after: int = None):
    #     skip = 0 if after is None else 1
    #     conversations = Conversation.prisma().find_many(
    #         take=first,
    #         skip=skip,
    #         cursor={
    #             "id": after
    #         },
    #         include={
    #             "messages": True
    #         },
    #         where={
    #             "projectId": project_id
    #         }
    #     )

    #     json_conversations = []

    #     for c in conversations:
    #         if not c.messages:
    #             continue
    #         messages = []
    #         for m in c.messages:
    #             if m.llmSettings:
    #                 m.llmSettings = json.loads(m.llmSettings)
    #             messages.append(m.dict())
    #         conversation = c.dict(exclude={"messages": True})
    #         conversation["messages"] = messages
    #         json_conversations.append(conversation)
    #     print(json_conversations)
