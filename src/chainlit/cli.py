import gevent
from gevent import monkey
monkey.patch_all()

from chainlit.config import config, init_config, load_module
import webbrowser
from chainlit.markdown import init_markdown
from chainlit.watch import watch_dir
import os
import click
import sys
import logging

try:
    import chainlit.lc.monkey
    import langchain
    from langchain.callbacks import get_callback_manager
    from chainlit.uihandler import UiCallbackHandler
    from langchain.cache import SQLiteCache

    if config.lc_cache_path:
        print("LangChain cached enabled: ", config.lc_cache_path)
        langchain.llm_cache = SQLiteCache(
            database_path=config.lc_cache_path)

    get_callback_manager()._callback_manager.add_handler(UiCallbackHandler())

    LANGCHAIN_INSTALLED = True
except ImportError:
    LANGCHAIN_INSTALLED = False

# from gunicorn.app.wsgiapp import WSGIApplication
# from chainlit.local_db import init_local_db

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

PORT = 8000

# class StandaloneApplication(WSGIApplication):
#     def __init__(self, app_uri, options=None):
#         self.options = options or {}
#         self.app_uri = app_uri
#         super().__init__()

#     def load_config(self):
#         config = {
#             key: value
#             for key, value in self.options.items()
#             if key in self.cfg.settings and value is not None
#         }
#         for key, value in config.items():
#             self.cfg.set(key.lower(), value)

#     # def load(self):
#     #     from gevent import monkey
#     #     monkey.patch_all()
#     #     return self.application


ACCEPTED_FILE_EXTENSIONS = ("py", "py3")
LOG_LEVELS = ("error", "warning", "info", "debug")


@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.option("--log-level", show_default=True, type=click.Choice(LOG_LEVELS))
@click.version_option(prog_name="Chainlit")
def cli(log_level="info"):
    if log_level:
        from logger import get_logger

        LOGGER = get_logger(__name__)
        LOGGER.warning(
            "Setting the log level using the --log_level flag is unsupported."
        )


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
@click.argument("args", nargs=-1)
def run_chainlit(target, watch, headless, args=None, **kwargs):
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

    load_module(target)

    if watch:
        watch_dir()

    init_markdown(config.root)

    if not headless and config.chainlit_env == "development":
        webbrowser.open(f"http://127.0.0.1:{PORT}")

    # if not config.auth and config.project_id is None and config.chainlit_env == "development":
    #     init_local_db()

    from chainlit.server import socketio, app
    socketio.run(app, port=PORT, debug=True, use_reloader=False)


@cli.command("init")
@click.argument("args", nargs=-1)
def chainlit_init(args=None, **kwargs):
    init_config(log=True)

# def _main_run(
#     args: Optional[List[str]] = None,
#     flag_options: Optional[Dict[str, Any]] = None,
# ) -> None:
#     if args is None:
#         args = []

#     if flag_options is None:
#         flag_options = {}


#     # from chainlit.server import app
#     # options = {
#     #     "bind": "0.0.0.0:5000",
#     #     # "workers": (multiprocessing.cpu_count() * 2) + 1,
#     #     "workers": 1,
#     #     "worker_class": "geventwebsocket.gunicorn.workers.GeventWebSocketWorker",
#     # }
#     # StandaloneApplication("chainlit.server:app", options).run()
