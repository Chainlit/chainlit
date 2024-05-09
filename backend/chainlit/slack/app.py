import asyncio
import os
import uuid
from typing import Dict, Optional, Union

import httpx
from chainlit.config import config
from chainlit.context import ChainlitContext, HTTPSession, context_var
from chainlit.data import get_data_layer
from chainlit.element import Element, ElementDict
from chainlit.emitter import BaseChainlitEmitter
from chainlit.message import Message, StepDict
from chainlit.user import PersistedUser, User
from chainlit.user_session import user_session
from slack_bolt.adapter.fastapi.async_handler import AsyncSlackRequestHandler
from slack_bolt.async_app import AsyncApp


class SlackEmitter(BaseChainlitEmitter):
    def __init__(
        self, session: HTTPSession, app: AsyncApp, channel_id: str, say, enabled=False
    ):
        super().__init__(session)
        self.app = app
        self.channel_id = channel_id
        self.say = say
        self.enabled = enabled

    async def send_element(self, element_dict: ElementDict):
        if not self.enabled:
            return

        persisted_file = self.session.files.get(element_dict.get("chainlitKey") or "")
        file: Optional[Union[bytes, str]] = None

        if persisted_file:
            file = str(persisted_file["path"])
        elif file_url := element_dict.get("url"):
            async with httpx.AsyncClient() as client:
                response = await client.get(file_url)
                if response.status_code == 200:
                    file = response.content

        if not file:
            return

        await self.app.client.files_upload_v2(
            channel=self.channel_id,
            file=file,
            title=element_dict.get("name"),
        )

    async def send_step(self, step_dict: StepDict):
        if not self.enabled:
            return

        if step_dict.get("type") == "user_message" or step_dict.get("parentId"):
            return
        else:
            await self.say(step_dict["output"])


slack_app = AsyncApp(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET"),
)


def init_slack_context(
    session: HTTPSession,
    slack_channel_id: str,
    event,
    say,
) -> ChainlitContext:
    emitter = SlackEmitter(
        session=session, app=slack_app, channel_id=slack_channel_id, say=say
    )
    context = ChainlitContext(session=session, emitter=emitter)
    context_var.set(context)
    user_session.set("slack_event", event)
    return context


slack_app_handler = AsyncSlackRequestHandler(slack_app)

users_by_slack_id: Dict[str, Union[User, PersistedUser]] = {}

USER_PREFIX = "slack_"


async def get_user(slack_user_id: str):
    slack_user = await slack_app.client.users_info(user=slack_user_id)
    slack_user_profile = slack_user["user"]["profile"]

    user_email = slack_user_profile.get("email")
    user = User(identifier=USER_PREFIX + user_email, metadata=slack_user_profile)

    users_by_slack_id[slack_user_id] = user

    if data_layer := get_data_layer():
        persisted_user = await data_layer.create_user(user)
        if persisted_user:
            users_by_slack_id[slack_user_id] = persisted_user

    return users_by_slack_id[slack_user_id]


async def download_slack_file(url, token):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code == 200:
            return response.content
        else:
            return None


async def download_slack_files(session: HTTPSession, files, token):
    download_coros = [
        download_slack_file(file.get("url_private"), token) for file in files
    ]
    file_bytes_list = await asyncio.gather(*download_coros)
    file_refs = []
    for idx, file_bytes in enumerate(file_bytes_list):
        if file_bytes:
            name = files[idx].get("name")
            mime_type = files[idx].get("mimetype")
            file_ref = await session.persist_file(
                name=name, mime=mime_type, content=file_bytes
            )
            file_refs.append(file_ref)

    files_dicts = [
        session.files[file["id"]] for file in file_refs if file["id"] in session.files
    ]

    file_elements = [Element.from_dict(file_dict) for file_dict in files_dicts]

    return file_elements


async def process_slack_message(
    event, say, thread_name: str, bind_thread_to_user=False
):
    user = await get_user(event["user"])

    channel_id = event["channel"]
    thread_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, channel_id))

    text = event.get("text")
    slack_files = event.get("files", [])

    session_id = str(uuid.uuid4())
    session = HTTPSession(
        id=session_id,
        thread_id=thread_id,
        user=user,
        client_type="slack",
    )

    ctx = init_slack_context(
        session=session,
        slack_channel_id=channel_id,
        event=event,
        say=say,
    )

    file_elements = await download_slack_files(
        session, slack_files, slack_app.client.token
    )

    msg = Message(
        content=text,
        elements=file_elements,
        type="user_message",
        author=user.metadata.get("real_name"),
    )

    await msg.send()

    ctx.emitter.enabled = True

    if on_chat_start := config.code.on_chat_start:
        await on_chat_start()

    if on_message := config.code.on_message:
        await on_message(msg)

    if on_chat_end := config.code.on_chat_end:
        await on_chat_end()

    if data_layer := get_data_layer():
        user_id = None
        if isinstance(user, PersistedUser):
            user_id = user.id if bind_thread_to_user else None

        await data_layer.update_thread(
            thread_id=thread_id,
            name=thread_name,
            metadata=ctx.session.to_persistable(),
            user_id=user_id,
        )

    ctx.session.delete()


@slack_app.event("app_home_opened")
async def handle_app_home_opened(event, say):
    pass


@slack_app.event("app_mention")
async def handle_app_mentions(event, say):
    response = await slack_app.client.conversations_info(channel=event["channel"])
    channel_name = response["channel"]["name"]
    thread_name = f"{channel_name} Slack Channel"
    await process_slack_message(event, say, thread_name)


@slack_app.event("message")
async def handle_message(message, say):
    user = await get_user(message["user"])
    thread_name = f"{user.identifier} DM"
    await process_slack_message(message, say, thread_name)
