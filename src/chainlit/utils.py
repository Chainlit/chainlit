from typing import Callable
import inspect

from chainlit.context import get_emitter
from chainlit.logger import logger
from chainlit.message import ErrorMessage


def wrap_user_function(user_function: Callable, with_task=False) -> Callable:
    """
    Wraps a user-defined function to accept arguments as a dictionary.

    Args:
        user_function (Callable): The user-defined function to wrap.

    Returns:
        Callable: The wrapped function.
    """

    async def wrapper(*args):
        # Get the parameter names of the user-defined function
        user_function_params = list(inspect.signature(user_function).parameters.keys())

        # Create a dictionary of parameter names and their corresponding values from *args
        params_values = {
            param_name: arg for param_name, arg in zip(user_function_params, args)
        }

        if with_task:
            emitter = get_emitter()
            await emitter.task_start()

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
                emitter = get_emitter()
                await emitter.task_end()

    return wrapper
