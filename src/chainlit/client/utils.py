from fastapi import Request

from chainlit.config import config
from chainlit.client.base import BaseDBClient, BaseAuthClient, UserDict
from chainlit.client.local import LocalAuthClient, LocalDBClient
from chainlit.client.cloud import CloudAuthClient, CloudDBClient
from chainlit.telemetry import trace_event


async def get_auth_client(authorization: str) -> BaseAuthClient:
    # Check authorization
    if not config.project.public and not authorization:
        # Refuse connection if the app is private and no access token is provided
        trace_event("no_access_token")
        raise ConnectionRefusedError("No access token provided")
    elif authorization and config.project.id:
        # Create the auth cloud client
        auth_client = CloudAuthClient(
            project_id=config.project.id,
            access_token=authorization,
        )
        # Check if the user is a member of the project
        is_project_member = await auth_client.is_project_member()
        if not is_project_member:
            raise ConnectionRefusedError("User is not a member of the project")

        return auth_client

    # Default to local auth client
    return LocalAuthClient()


async def get_db_client(
    authorization: str = None, user_infos: UserDict = None
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
        if not config.code.client_factory:
            raise ValueError("Client factory not provided")

        custom_db_client = await config.code.client_factory(user_infos)
        return custom_db_client


async def get_auth_client_from_request(
    request: Request,
) -> BaseAuthClient:
    authorization = request.headers.get("Authorization")

    # Get the auth client
    auth_client = await get_auth_client(authorization)

    return auth_client


async def get_db_client_from_request(
    request: Request,
) -> BaseDBClient:
    authorization = request.headers.get("Authorization")

    # Get the auth client
    auth_client = await get_auth_client(authorization)

    # Get the db client
    db_client = await get_db_client(authorization, auth_client.user_infos)

    return db_client
