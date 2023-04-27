import logging
import click
import os
import webbrowser
from chainlit.config import config, init_config, load_module
from chainlit.watch import watch_directory
from chainlit.markdown import init_markdown

# Check if LangChain is installed and set up cache and callback handler
try:
    import langchain
    from langchain.cache import SQLiteCache

    if config.lc_cache_path:
        langchain.llm_cache = SQLiteCache(
            database_path=config.lc_cache_path)
        if not os.path.exists(config.lc_cache_path):
            logging.info(f"LangChain cache enabled: {config.lc_cache_path}")

    import chainlit.lc.monkey
    from langchain.callbacks import get_callback_manager
    from chainlit.lc.chainlit_handler import ChainlitCallbackHandler

    get_callback_manager()._callback_manager.add_handler(ChainlitCallbackHandler())

    LANGCHAIN_INSTALLED = True
except ImportError:
    LANGCHAIN_INSTALLED = False

# Set the default port for the server
PORT = 8000

# Define accepted file extensions for Chainlit
ACCEPTED_FILE_EXTENSIONS = ("py", "py3")


# Create the main command group for Chainlit CLI
@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.version_option(prog_name="Chainlit")
def cli():
    return


# Define the function to run Chainlit with provided options
def run_chainlit(target: str, watch=False, headless=False, debug=False, args=None, **kwargs):
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

    # Load the module provided by the user
    config.module_name = target
    load_module(config.module_name)

    # Create the chainlit.md file if it doesn't exist
    init_markdown(config.root)

    # Enable file watching if the user specified it
    if watch:
        watch_directory()

    from chainlit.server import socketio, app

    # Open the browser if in development mode
    def open_browser(headless: bool):
        if not headless and config.chainlit_env == "development":
            # Wait two seconds to allow the server to start
            socketio.sleep(2)
            webbrowser.open(f"http://127.0.0.1:{PORT}")

    socketio.start_background_task(open_browser, headless)
    # Start the server
    socketio.run(app, port=PORT, debug=debug, use_reloader=False)


# Define the "run" command for Chainlit CLI
@cli.command("run")
@click.argument("target", required=True, envvar="CHAINLIT_RUN_TARGET")
@click.option("-w", "--watch", default=False, is_flag=True, envvar="CHAINLIT_WATCH")
@click.option("-h", "--headless", default=False, is_flag=True, envvar="CHAINLIT_HEADLESS")
@click.option("-d", "--debug", default=False, is_flag=True, envvar="CHAINLIT_DEBUG")
@click.argument("args", nargs=-1)
def run_chainlit_command(target, watch, headless, debug, args=None, **kwargs):
    run_chainlit(target, watch, headless, debug, args, **kwargs)


# Define the "hello" command for Chainlit CLI
@cli.command("hello")
@click.argument("args", nargs=-1)
def chainlit_hello(args=None, **kwargs):
    dir_path = os.path.dirname(os.path.realpath(__file__))
    hello_path = os.path.join(dir_path, "hello.py")
    run_chainlit(hello_path)


# Define the "init" command for Chainlit CLI
@cli.command("init")
@click.argument("args", nargs=-1)
def chainlit_init(args=None, **kwargs):
    init_config(log=True)
