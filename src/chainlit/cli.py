import click
import os
import sys
from typing import Any, Dict, List, Optional
from chainlit.config import config
from chainlit.server import run
import webbrowser

ACCEPTED_FILE_EXTENSIONS = ("py", "py3")
LOG_LEVELS = ("error", "warning", "info", "debug")


@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.option("--log_level", show_default=True, type=click.Choice(LOG_LEVELS))
@click.version_option(prog_name="Chainlit")
def main(log_level="error"):
    if log_level:
        from logger import get_logger

        LOGGER = get_logger(__name__)
        LOGGER.warning(
            "Setting the log level using the --log_level flag is unsupported."
        )


@main.command("run")
@click.argument("target", required=True, envvar="CHAINLIT_RUN_TARGET")
@click.option("--headless", default=False, envvar="CHAINLIT_HEADLESS")
@click.option("--bot_name", default="Chatbot", envvar="CHAINLIT_BOT_NAME")
@click.argument("args", nargs=-1)
def main_run(target: str, headless: bool, bot_name: str, args=None, **kwargs):
    _, extension = os.path.splitext(target)
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

    _main_run(prepare_import(target), headless,
              bot_name, args, flag_options=kwargs)


def prepare_import(path):
    """Given a filename this will try to calculate the python path, add it
    to the search path and return the actual module name that is expected.
    """
    path = os.path.realpath(path)

    fname, ext = os.path.splitext(path)
    if ext == ".py":
        path = fname

    if os.path.basename(path) == "__init__":
        path = os.path.dirname(path)

    module_name = []

    # move up until outside package structure (no __init__.py)
    while True:
        path, name = os.path.split(path)
        module_name.append(name)

        if not os.path.exists(os.path.join(path, "__init__.py")):
            break

    if sys.path[0] != path:
        sys.path.insert(0, path)

    return ".".join(module_name[::-1])


def _main_run(
    module,
    headless,
    bot_name,
    args: Optional[List[str]] = None,
    flag_options: Optional[Dict[str, Any]] = None,
) -> None:
    if args is None:
        args = []

    if flag_options is None:
        flag_options = {}

    config.module = module
    config.headless = headless
    config.bot_name = bot_name
    if not config.headless:
        webbrowser.open("http://127.0.0.1:5000")
    run()
