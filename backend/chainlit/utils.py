import functools
import importlib
import inspect
import os
from asyncio import CancelledError
from typing import Callable

import click
from chainlit.auth import ensure_jwt_secret
from chainlit.context import context
from chainlit.logger import logger
from chainlit.message import ErrorMessage
from fastapi import FastAPI
from packaging import version


def wrap_user_function(user_function: Callable, with_task=False) -> Callable:
    """
    Wraps a user-defined function to accept arguments as a dictionary.

    Args:
        user_function (Callable): The user-defined function to wrap.

    Returns:
        Callable: The wrapped function.
    """

    @functools.wraps(user_function)
    async def wrapper(*args):
        # Get the parameter names of the user-defined function
        user_function_params = list(inspect.signature(user_function).parameters.keys())

        # Create a dictionary of parameter names and their corresponding values from *args
        params_values = {
            param_name: arg for param_name, arg in zip(user_function_params, args)
        }

        if with_task:
            await context.emitter.task_start()

        try:
            # Call the user-defined function with the arguments
            if inspect.iscoroutinefunction(user_function):
                return await user_function(**params_values)
            else:
                return user_function(**params_values)
        except CancelledError:
            pass
        except Exception as e:
            logger.exception(e)
            if with_task:
                await ErrorMessage(
                    content=str(e) or e.__class__.__name__, author="Error"
                ).send()
        finally:
            if with_task:
                await context.emitter.task_end()

    return wrapper


def make_module_getattr(registry):
    """Leverage PEP 562 to make imports lazy in an __init__.py

    The registry must be a dictionary with the items to import as keys and the
    modules they belong to as a value.
    """

    def __getattr__(name):
        module_path = registry[name]
        module = importlib.import_module(module_path, __package__)
        return getattr(module, name)

    return __getattr__


def check_module_version(name, required_version):
    """
    Check the version of a module.

    Args:
        name (str): A module name.
        version (str): Minimum version.

    Returns:
        (bool): Return True if the module is installed and the version
            match the minimum required version.
    """
    try:
        module = importlib.import_module(name)
    except ModuleNotFoundError:
        return False
    return version.parse(module.__version__) >= version.parse(required_version)


def check_file(target: str):
    # Define accepted file extensions for Chainlit
    ACCEPTED_FILE_EXTENSIONS = ("py", "py3")

    _, extension = os.path.splitext(target)

    # Check file extension
    if extension[1:] not in ACCEPTED_FILE_EXTENSIONS:
        if extension[1:] == "":
            raise click.BadArgumentUsage(
                "Chainlit requires raw Python (.py) files, but the provided file has no extension."
            )
        else:
            raise click.BadArgumentUsage(
                f"Chainlit requires raw Python (.py) files, not {extension}."
            )

    if not os.path.exists(target):
        raise click.BadParameter(f"File does not exist: {target}")


def mount_chainlit(app: FastAPI, target: str, path="/chainlit"):
    os.environ["CHAINLIT_ROOT_PATH"] = path
    os.environ["CHAINLIT_SUBMOUNT"] = "true"
    from chainlit.config import config, load_module
    from chainlit.server import combined_asgi_app as chainlit_app

    config.run.root_path = path
    config.run.debug = os.environ.get("CHAINLIT_DEBUG", False)

    check_file(target)
    # Load the module provided by the user
    config.run.module_name = target
    load_module(config.run.module_name)

    ensure_jwt_secret()

    app.mount("/", chainlit_app)
