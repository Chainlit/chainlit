import click
import os, sys
from typing import Any, Dict, List, Optional
from rush.config import config
from rush.server import run

ACCEPTED_FILE_EXTENSIONS = ("py", "py3")
LOG_LEVELS = ("error", "warning", "info", "debug")

@click.group(context_settings={"auto_envvar_prefix": "STREAMLIT"})
@click.option("--log_level", show_default=True, type=click.Choice(LOG_LEVELS))
@click.version_option(prog_name="Streamlit")
def main(log_level="info"):
    """Try out a demo with:
        $ streamlit hello
    Or use the line below to run your own script:
        $ streamlit run your_script.py
    """

    if log_level:
        from logger import get_logger

        LOGGER = get_logger(__name__)
        LOGGER.warning(
            "Setting the log level using the --log_level flag is unsupported."
            "\nUse the --logger.level flag (after your streamlit command) instead."
        )


@main.command("run")
@click.argument("target", required=True, envvar="STREAMLIT_RUN_TARGET")
@click.argument("bot_name", required=False, envvar="STREAMLIT_BOT_NAME")
@click.argument("args", nargs=-1)
def main_run(target: str, bot_name: str, args=None, **kwargs):
    """Run a Python script, piping stderr to Streamlit.
    The script can be local or it can be an url. In the latter case, Streamlit
    will download the script to a temporary file and runs this file.
    """
    _, extension = os.path.splitext(target)
    if extension[1:] not in ACCEPTED_FILE_EXTENSIONS:
        if extension[1:] == "":
            raise click.BadArgumentUsage(
                "Streamlit requires raw Python (.py) files, but the provided file has no extension.\nFor more information, please see https://docs.streamlit.io"
            )
        else:
            raise click.BadArgumentUsage(
                f"Streamlit requires raw Python (.py) files, not {extension}.\nFor more information, please see https://docs.streamlit.io"
            )

    if not os.path.exists(target):
        raise click.BadParameter(f"File does not exist: {target}")
        
    _main_run(prepare_import(target), bot_name, args, flag_options=kwargs)

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
    bot_name,
    args: Optional[List[str]] = None,
    flag_options: Optional[Dict[str, Any]] = None,
) -> None:
    if args is None:
        args = []

    if flag_options is None:
        flag_options = {}


    config.module = module
    if bot_name:
        config.bot_name = bot_name
    run()

    