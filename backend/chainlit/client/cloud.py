import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

import httpx
from chainlit.logger import logger

from .base import (
    AppUser,
    ChainlitGraphQLClient,
    ConversationDict,
    ConversationFilter,
    ElementDict,
    MessageDict,
    PageInfo,
    PaginatedResponse,
    Pagination,
    PersistedAppUser,
)


class ChainlitCloudClient(ChainlitGraphQLClient):
    chainlit_server: str

    def __init__(self, api_key: str, chainlit_server="https://cloud.chainlit.io"):
        # Remove trailing slash
        chainlit_server = chainlit_server.rstrip("/")
        super().__init__(api_key=api_key, chainlit_server=chainlit_server)
        self.chainlit_server = chainlit_server

    async def create_app_user(self, app_user: AppUser) -> Optional[PersistedAppUser]:
        mutation = """
            mutation ($username: String!, $role: Role!, $tags: [String!], $provider: String, $image: String) {
                createAppUser(username: $username, role: $role, tags: $tags, provider: $provider, image: $image) {
                    id,
                    username,
                    role,
                    tags,
                    provider,
                    image,
                    createdAt
                }
            }
            """
        variables = app_user.to_dict()
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not create app user.")
            return None

        return PersistedAppUser.from_dict(res["data"]["createAppUser"])

    async def update_app_user(self, app_user: AppUser) -> Optional[PersistedAppUser]:
        mutation = """
            mutation ($username: String!, $role: Role!, $tags: [String!], $provider: String, $image: String) {
                updateAppUser(username: $username, role: $role, tags: $tags, provider: $provider, image: $image) {
                    id,
                    username,
                    role,
                    tags,
                    provider,
                    image,
                    createdAt
                }
            }
            """
        variables = app_user.to_dict()
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not update app user.")
            return None

        return PersistedAppUser.from_dict(res["data"]["updateAppUser"])

    async def get_app_user(self, username: str) -> Optional[PersistedAppUser]:
        query = """
             query ($username: String!) {
                getAppUser(username: $username) {
                    id,
                    username,
                    role,
                    tags,
                    provider,
                    image,
                    createdAt
                }
            }
            """
        variables = {"username": username}
        res = await self.query(query, variables)

        if self.check_for_errors(res):
            logger.warning("Could not get app user.")
            return None

        return PersistedAppUser.from_dict(res["data"]["getAppUser"])

    async def delete_app_user(self, username: str) -> bool:
        mutation = """
                mutation ($username: String!) {
                    deleteAppUser(username: $username) {
                        id,
                    }
                }
                """
        variables = {"username": username}
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not delete app user.")
            return False

        return True

    async def create_conversation(
        self, app_user_id: Optional[str], tags: Optional[List[str]]
    ) -> Optional[str]:
        mutation = """
        mutation ($appUserId: String, $tags: [String!]) {
            createConversation (appUserId: $appUserId, tags: $tags) {
                id
            }
        }
        """
        variables = {}  # type: Dict[str, Any]
        if app_user_id is not None:
            variables["appUserId"] = app_user_id

        if tags:
            variables["tags"] = tags

        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not create conversation.")
            return None

        return res["data"]["createConversation"]["id"]

    async def delete_conversation(self, conversation_id: str) -> bool:
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

    async def get_conversation_author(self, conversation_id: str) -> Optional[str]:
        query = """
        query ($id: ID!) {
            conversation(id: $id) {
               appUser {
                   username
               }
            }
        }
        """
        variables = {
            "id": conversation_id,
        }
        res = await self.query(query, variables)
        self.check_for_errors(res, raise_error=True)
        data = res.get("data")
        conversation = data.get("conversation") if data else None
        if not conversation:
            return None
        return (
            conversation["appUser"].get("username") if conversation["appUser"] else None
        )

    async def get_conversation(self, conversation_id: str) -> ConversationDict:
        query = """
        query ($id: ID!) {
            conversation(id: $id) {
                id
                createdAt
                tags
                metadata
                appUser {
                    id
                    username
                }
                messages {
                    id
                    isError
                    parentId
                    indent
                    author
                    content
                    waitForAnswer
                    humanFeedback
                    humanFeedbackComment
                    disableHumanFeedback
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
                    mime
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

    async def update_conversation_metadata(self, conversation_id: str, metadata: Dict):
        mutation = """mutation ($conversationId: ID!, $metadata: Json!) {
                    updateConversationMetadata(conversationId: $conversationId, metadata: $metadata) {
                            id
                    }
                }"""
        variables = {
            "conversationId": conversation_id,
            "metadata": metadata,
        }

        res = await self.mutation(mutation, variables)
        self.check_for_errors(res, raise_error=True)

        return True

    async def get_conversations(
        self, pagination: Pagination, filter: ConversationFilter
    ):
        query = """query (
        $first: Int
        $cursor: String
        $withFeedback: Int
        $username: String
        $search: String
    ) {
        conversations(
        first: $first
        cursor: $cursor
        withFeedback: $withFeedback
        username: $username
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
            tags
            appUser {
                username
            }
            messages {
                content
            }
            }
        }
        }
    }"""

        variables = {
            "first": pagination.first,
            "cursor": pagination.cursor,
            "withFeedback": filter.feedback,
            "username": filter.username,
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

    async def set_human_feedback(
        self, message_id: str, feedback: int, feedbackComment: Optional[str]
    ) -> bool:
        mutation = """mutation ($messageId: ID!, $humanFeedback: Int!, $humanFeedbackComment: String) {
                    setHumanFeedback(messageId: $messageId, humanFeedback: $humanFeedback, humanFeedbackComment: $humanFeedbackComment) {
                            id
                            humanFeedback
                            humanFeedbackComment
                    }
                }"""
        variables = {
            "messageId": message_id,
            "humanFeedback": feedback,
        }
        if feedbackComment:
            variables["humanFeedbackComment"] = feedbackComment
        res = await self.mutation(mutation, variables)
        self.check_for_errors(res, raise_error=True)

        return True

    async def get_message(self):
        raise NotImplementedError

    async def create_message(self, variables: MessageDict) -> Optional[str]:
        mutation = """
        mutation ($id: ID!, $conversationId: ID!, $author: String!, $content: String!, $language: String, $prompt: Json, $isError: Boolean, $parentId: String, $indent: Int, $authorIsUser: Boolean, $disableHumanFeedback: Boolean, $waitForAnswer: Boolean, $createdAt: StringOrFloat) {
            createMessage(id: $id, conversationId: $conversationId, author: $author, content: $content, language: $language, prompt: $prompt, isError: $isError, parentId: $parentId, indent: $indent, authorIsUser: $authorIsUser, disableHumanFeedback: $disableHumanFeedback, waitForAnswer: $waitForAnswer, createdAt: $createdAt) {
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
        mutation ($messageId: ID!, $author: String!, $content: String!, $parentId: String, $language: String, $prompt: Json, $disableHumanFeedback: Boolean) {
            updateMessage(messageId: $messageId, author: $author, content: $content, parentId: $parentId, language: $language,  prompt: $prompt, disableHumanFeedback: $disableHumanFeedback) {
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

    async def get_element(
        self, conversation_id: str, element_id: str
    ) -> Optional[ElementDict]:
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
        mime
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

    async def create_element(self, variables: ElementDict) -> Optional[ElementDict]:
        mutation = """
        mutation ($conversationId: ID!, $type: String!, $name: String!, $display: String!, $forIds: [String!]!, $url: String, $objectKey: String, $size: String, $language: String, $mime: String) {
            createElement(conversationId: $conversationId, type: $type, url: $url, objectKey: $objectKey, name: $name, display: $display, size: $size, language: $language, forIds: $forIds, mime: $mime) {
                id,
                type,
                url,
                objectKey,
                name,
                display,
                size,
                language,
                forIds,
                mime
            }
        }
        """
        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not create element.")
            return None

        return res["data"]["createElement"]

    async def update_element(self, variables: ElementDict) -> Optional[ElementDict]:
        mutation = """
        mutation ($conversationId: ID!, $id: ID!, $forIds: [String!]!) {
            updateElement(conversationId: $conversationId, id: $id, forIds: $forIds) {
                id,
            }
        }
        """

        res = await self.mutation(mutation, variables)

        if self.check_for_errors(res):
            logger.warning("Could not update element.")
            return None

        return res["data"]["updateElement"]

    async def upload_element(
        self, content: Union[bytes, str], mime: str, conversation_id: Optional[str]
    ) -> Dict:
        id = str(uuid.uuid4())
        body = {"fileName": id, "contentType": mime}

        if conversation_id:
            body["conversationId"] = conversation_id

        path = "/api/upload/file"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.chainlit_server}{path}",
                json=body,
                headers=self.headers,
            )
            if response.status_code != 200:
                reason = response.text
                logger.error(f"Failed to sign upload url: {reason}")
                return {"object_key": None, "url": None}
            json_res = response.json()

        upload_details = json_res["post"]
        object_key = upload_details["fields"]["key"]
        signed_url = json_res["signedUrl"]

        # Prepare form data
        form_data = {}  # type: Dict[str, Tuple[Union[str, None], Any]]
        for field_name, field_value in upload_details["fields"].items():
            form_data[field_name] = (None, field_value)

        # Add file to the form_data
        # Note: The content_type parameter is not needed here, as the correct MIME type should be set in the 'Content-Type' field from upload_details
        form_data["file"] = (id, content)

        async with httpx.AsyncClient() as client:
            upload_response = await client.post(
                upload_details["url"],
                files=form_data,
            )
            try:
                upload_response.raise_for_status()
                url = f'{upload_details["url"]}/{object_key}'
                return {"object_key": object_key, "url": signed_url}
            except Exception as e:
                logger.error(f"Failed to upload file: {str(e)}")
                return {"object_key": None, "url": None}
