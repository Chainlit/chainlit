from typing import Literal, Union

from pydantic import BaseModel


class StdioMcpConnection(BaseModel):
    name: str
    command: str
    args: list[str]
    clientType: Literal["stdio"] = "stdio"


class SseMcpConnection(BaseModel):
    name: str
    url: str
    clientType: Literal["sse"] = "sse"


McpConnection = Union[StdioMcpConnection, SseMcpConnection]


def validate_npx_command(command_string: str):
    """
    Validates that a command string uses 'npx' as the executable and returns
    the executable and list of arguments suitable for subprocess calls.

    This function handles potential command prefixes, flags, and options
    to ensure only npx commands are allowed.

    Args:
        command_string (str): The full command string to validate

    Returns:
        tuple: (executable, args_list) where:
            - executable (str): Always 'npx' if valid
            - args_list (list): List of command arguments

    Raises:
        ValueError: If the command doesn't use 'npx' as the executable
    """
    # Split the command string into parts
    parts = command_string.strip().split()

    if not parts:
        raise ValueError("Empty command string")

    # Look for the actual executable in the command
    executable_index = None
    for i, part in enumerate(parts):
        # Remove any path components to get the base executable name
        base_exec = part.split("/")[-1].split("\\")[-1]
        if base_exec == "npx":
            executable_index = i
            break

    if executable_index is None:
        raise ValueError("Only 'npx' commands are allowed")

    # Return 'npx' as the executable and everything after it as args
    executable = "npx"
    args_list = parts[executable_index + 1 :]

    return executable, args_list
