from pathlib import Path
from typing import Literal, Union

from pydantic import BaseModel

from chainlit.config import config
from chainlit.types import ConnectSseMCPRequest, ConnectStdioMCPRequest


class StdioMcpConnection(BaseModel):
    name: str
    command: str
    args: list[str]
    envs: dict[str, str]
    clientType: Literal["stdio"] = "stdio"


class SseMcpConnection(BaseModel):
    name: str
    url: str
    headers: dict[str, str]
    clientType: Literal["sse"] = "sse"


McpConnection = Union[StdioMcpConnection, SseMcpConnection]


def build_stdio_mcp_connection(payload: ConnectStdioMCPRequest) -> StdioMcpConnection:
    mcp_connection = StdioMcpConnection(
        name=payload.name,
        command=payload.command,
        args=payload.args.split() if payload.args else [],
        envs={},
    )
    base_name = Path(payload.command).name
    if (
        config.features.mcp.stdio.allowed_executables is not None
        and base_name not in config.features.mcp.stdio.allowed_executables
    ):
        raise ValueError(
            f"Only commands in ({', '.join(config.features.mcp.stdio.allowed_executables)}) are allowed"
        )
    if payload.envs:
        for env in payload.envs.split():
            if "=" not in env:
                raise ValueError(f"Invalid environment variable format: {env}")
            key, value = env.split("=", 1)
            mcp_connection.envs[key] = value
    return mcp_connection


def build_sse_mcp_connection(payload: ConnectSseMCPRequest) -> SseMcpConnection:
    mcp_connection = SseMcpConnection(
        name=payload.name,
        url=payload.url,
        headers={},
    )
    if payload.headers:
        for header in payload.headers.split():
            if ":" not in header:
                raise ValueError(f"Invalid header format: {header}")
            key, value = header.split(":", 1)
            mcp_connection.headers[key] = value
    return mcp_connection
