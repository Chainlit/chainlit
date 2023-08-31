import functools
import importlib
import inspect
from typing import Callable

from chainlit.context import context
from chainlit.logger import logger
from chainlit.message import ErrorMessage
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
        except InterruptedError:
            pass
        except Exception as e:
            logger.exception(e)
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
