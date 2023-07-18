from typing import Dict
import json
from fastapi import Request

from chainlit.config import config
from chainlit.client.base import BaseDBClient, BaseAuthClient, UserDict
from chainlit.client.local import LocalAuthClient, LocalDBClient
from chainlit.client.cloud import CloudAuthClient, CloudDBClient
from chainlit.telemetry import trace_event


def load_chainlit_cookie(request: Request):
    cookie_string = request.cookies.get("chainlit-headers")
    if cookie_string:
        chainlit_headers = json.loads(cookie_string)
    else:
        chainlit_headers = {}

    return chainlit_headers


async def get_auth_client(
    authorization: str, headers: Dict[str, str] = {}
) -> BaseAuthClient:
    auth_client: BaseAuthClient = None
    if config.code.auth_client_factory:
        auth_client = await config.code.auth_client_factory(headers)
    # Check authorization
    elif not config.project.public and not authorization:
        # Refuse connection if the app is private and no access token is provided
        trace_event("no_access_token")
        raise ConnectionRefusedError("No access token provided")
    elif authorization and config.project.id:
        # Create the auth cloud client
        auth_client = CloudAuthClient(
            project_id=config.project.id,
            access_token=authorization,
        )

    if auth_client:
        # Check if the user is a member of the project
        is_project_member = await auth_client.is_project_member()
        if not is_project_member:
            raise ConnectionRefusedError("User is not a member of the project")

        return auth_client

    # Default to local auth client
    return LocalAuthClient()


async def get_db_client(
    authorization: str = None, headers: Dict[str, str] = {}, user_infos: UserDict = None
) -> BaseDBClient:
    # Create the database client
    if config.project.database == "cloud":
        if not config.project.id:
            raise ValueError("Project id is required for database mode 'cloud'")

        return CloudDBClient(
            project_id=config.project.id,
            access_token=authorization,
        )
    elif config.project.database == "local":
        return LocalDBClient(user_infos=user_infos)
    elif config.project.database == "custom":
        if not config.code.db_client_factory:
            raise ValueError("Db client factory not provided")

        custom_db_client = await config.code.db_client_factory(headers, user_infos)
        return custom_db_client


async def get_auth_client_from_request(
    request: Request,
) -> BaseAuthClient:
    authorization = request.headers.get("Authorization")

    chainlit_headers = load_chainlit_cookie(request)

    # Get the auth client
    auth_client = await get_auth_client(authorization, chainlit_headers)

    return auth_client


async def get_db_client_from_request(
    request: Request,
) -> BaseDBClient:
    authorization = request.headers.get("Authorization")
    chainlit_headers = load_chainlit_cookie(request)

    # Get the auth client
    auth_client = await get_auth_client(authorization, chainlit_headers)

    # Get the db client
    db_client = await get_db_client(
        authorization, chainlit_headers, auth_client.user_infos
    )

    return db_client
