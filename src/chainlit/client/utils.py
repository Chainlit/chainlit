from typing import Dict, Optional

from fastapi import HTTPException, Request
from starlette.datastructures import Headers

from chainlit.client.base import BaseAuthClient, BaseDBClient, UserDict
from chainlit.client.cloud import CloudAuthClient, CloudDBClient
from chainlit.client.local import LocalAuthClient, LocalDBClient
from chainlit.config import config


async def get_auth_client(
    handshake_headers: Optional[Dict[str, str]] = None,
    request_headers: Optional[Headers] = None,
) -> BaseAuthClient:
    auth_client: Optional[BaseAuthClient] = None
    if config.code.auth_client_factory:
        auth_client = await config.code.auth_client_factory(
            handshake_headers, request_headers
        )
    elif not config.project.public and config.project.id:
        # Create the auth cloud client
        auth_client = CloudAuthClient(
            project_id=config.project.id,
            handshake_headers=handshake_headers,
            request_headers=request_headers,
        )

    if auth_client:
        # Check if the user is a member of the project
        is_project_member = await auth_client.is_project_member()
        if not is_project_member:
            raise HTTPException(
                status_code=401, detail="User is not a member of the project"
            )

        return auth_client

    # Default to local auth client
    return LocalAuthClient()


async def get_db_client(
    handshake_headers: Optional[Dict[str, str]] = None,
    request_headers: Optional[Headers] = None,
    user_infos: Optional[UserDict] = None,
) -> BaseDBClient:
    # Create the database client
    if config.project.database == "cloud":
        if not config.project.id:
            raise ValueError("Project id is required for database mode 'cloud'")

        return CloudDBClient(
            project_id=config.project.id,
            handshake_headers=handshake_headers,
            request_headers=request_headers,
        )
    elif config.project.database == "local":
        return LocalDBClient(user_infos=user_infos)
    elif config.project.database == "custom":
        if not config.code.db_client_factory:
            raise ValueError("Db client factory not provided")

        custom_db_client = await config.code.db_client_factory(
            handshake_headers, request_headers, user_infos
        )
        return custom_db_client

    raise ValueError("Unknown database type")


async def get_auth_client_from_request(
    request: Request,
) -> BaseAuthClient:
    # Get the auth client
    auth_client = await get_auth_client(None, request.headers)

    return auth_client


async def get_db_client_from_request(
    request: Request,
) -> BaseDBClient:
    # Get the auth client
    auth_client = await get_auth_client(None, request.headers)

    # Get the db client
    db_client = await get_db_client(None, request.headers, auth_client.user_infos)

    return db_client
