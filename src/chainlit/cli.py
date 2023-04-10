import gevent
from gevent import monkey
monkey.patch_all()

import logging
import sys
import click
import os
import webbrowser
from chainlit.config import config, init_config, load_module
from chainlit.watch import watch_directory
from chainlit.markdown import init_markdown


try:
    import langchain
    from langchain.cache import SQLiteCache

    if config.lc_cache_path:
        print("LangChain cache enabled: ", config.lc_cache_path)
        langchain.llm_cache = SQLiteCache(
            database_path=config.lc_cache_path)

    import chainlit.lc.monkey
    from langchain.callbacks import get_callback_manager
    from chainlit.lc.chainlit_handler import ChainlitCallbackHandler

    get_callback_manager()._callback_manager.add_handler(ChainlitCallbackHandler())

    LANGCHAIN_INSTALLED = True
except ImportError:
    LANGCHAIN_INSTALLED = False

PORT = 8000

ACCEPTED_FILE_EXTENSIONS = ("py", "py3")
LOG_LEVELS = ("error", "warning", "info", "debug")

@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.option("--log-level", show_default=True, type=click.Choice(LOG_LEVELS))
@click.version_option(prog_name="Chainlit")
def cli(log_level="error"):
    if log_level:
        logging.basicConfig(level=log_level,
                            format='%(asctime)s - %(message)s',
                            datefmt='%Y-%m-%d %H:%M:%S')


def _prepare_import(path):
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


@cli.command("run")
@click.argument("target", required=True, envvar="CHAINLIT_RUN_TARGET")
@click.option("-w", "--watch", default=False, is_flag=True, envvar="CHAINLIT_WATCH")
@click.option("-h", "--headless", default=False, is_flag=True, envvar="CHAINLIT_HEADLESS")
@click.option("-d", "--debug", default=False, is_flag=True, envvar="CHAINLIT_DEBUG")
@click.argument("args", nargs=-1)
def run_chainlit(target, watch, headless, debug, args=None, **kwargs):
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

    config.module_name = _prepare_import(target)

    load_module(config.module_name)
    init_markdown(config.root)

    if watch:
        watch_directory()

    from chainlit.server import socketio, app

    def open_browser(headless: bool):
        if not headless and config.chainlit_env == "development":
            socketio.sleep(2)
            webbrowser.open(f"http://127.0.0.1:{PORT}")
    
    socketio.start_background_task(open_browser, headless)
    socketio.run(app, port=PORT, debug=debug, use_reloader=False)


@cli.command("init")
@click.argument("args", nargs=-1)
def chainlit_init(args=None, **kwargs):
    init_config(log=True)
