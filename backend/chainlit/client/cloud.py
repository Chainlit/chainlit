import asyncio
import uuid
from typing import Dict, Optional, Union

import aiohttp
from chainlit.config import config
from chainlit.logger import logger
from chainlit.types import AppUser, PersistedAppUser

from .base import ChainlitGraphQLClient, MessageDict, PageInfo, PaginatedResponse


class ChainlitCloudClient(ChainlitGraphQLClient):
    conversation_id: Optional[str] = None
    lock: asyncio.Lock

    def __init__(
        self,
    ):
        self.lock = asyncio.Lock()
        super().__init__()

    async def create_app_user(self, app_user: AppUser) -> Optional[PersistedAppUser]:
        mutation = """
            mutation ($username: String!, $role: Role!, $tags: [String], $provider: String, $image: String) {
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

    async def create_conversation(self) -> Optional[str]:
        # If we run multiple send concurrently, we need to make sure we don't create multiple conversations.
        async with self.lock:
            if self.conversation_id:
                return self.conversation_id

            mutation = """
            mutation () {
                createConversation() {
                    id
                }
            }
            """
            res = await self.mutation(mutation)

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
                    humanFeedbackDisabled
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
            elementCount
            messageCount
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
        body = {"fileName": id, "contentType": mime}

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


chainlit_client = None

if config.data_persistence:
    chainlit_client = ChainlitCloudClient()
