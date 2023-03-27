import click
import os
import sys
from typing import Any, Dict, List, Optional
from chainlit.config import config
from chainlit.db import init_db
import webbrowser

ACCEPTED_FILE_EXTENSIONS = ("py", "py3")
LOG_LEVELS = ("error", "warning", "info", "debug")

cwd = os.getcwd()

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

    return ".".join(module_name[::-1]) + ext


@main.command("run")
@click.argument("target", required=True, envvar="CHAINLIT_RUN_TARGET")
@click.option("-p", "--project-id", envvar="CHAINLIT_PROJECT_ID")
@click.option("-h","--headless", default=False, is_flag=True, envvar="CHAINLIT_HEADLESS")
@click.option("-d", "--db-path", default=f"{cwd}/.database.db", envvar="CHAINLIT_DB_PATH")
@click.option("-c", "--cache-path", default=f"{cwd}/.langchain.db", envvar="CHAINLIT_CACHE_PATH")
@click.option("-n", "--bot-name", default="Chatbot", envvar="CHAINLIT_BOT_NAME")
@click.argument("args", nargs=-1)
def main_run(target, project_id, headless, bot_name, db_path, cache_path, args=None, **kwargs):
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

    config.module = prepare_import(target)
    config.project_id = project_id
    config.headless = headless
    config.db_path = db_path
    config.cache_path = cache_path
    config.bot_name = bot_name

    init_db()

    _main_run(args, flag_options=kwargs)


def _main_run(
    args: Optional[List[str]] = None,
    flag_options: Optional[Dict[str, Any]] = None,
) -> None:
    if args is None:
        args = []

    if flag_options is None:
        flag_options = {}

    if not config.headless:
        webbrowser.open("http://127.0.0.1:5000")

    from chainlit.server import run
    run()
