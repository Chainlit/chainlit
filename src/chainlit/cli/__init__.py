import click
import os
import sys
import webbrowser
from chainlit.config import config, init_config, load_module
from chainlit.watch import watch_directory
from chainlit.markdown import init_markdown
from chainlit.cli.auth import login, logout
from chainlit.cli.deploy import deploy
from chainlit.cli.utils import check_file


# Set the default port for the server
PORT = 8000


# Create the main command group for Chainlit CLI
@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.version_option(prog_name="Chainlit")
def cli():
    return


# Define the function to run Chainlit with provided options
def run_chainlit(target: str, watch=False, headless=False, debug=False, args=None, **kwargs):
    check_file(target)
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
def chainlit_run(target, watch, headless, debug, args=None, **kwargs):
    run_chainlit(target, watch, headless, debug, args, **kwargs)


@cli.command("deploy")
@click.argument("target", required=True, envvar="CHAINLIT_RUN_TARGET")
@click.argument("args", nargs=-1)
def chainlit_deploy(target, args=None, **kwargs):
    raise NotImplementedError("Deploy is not yet implemented")
    deploy(target)


@cli.command("hello")
@click.argument("args", nargs=-1)
def chainlit_hello(args=None, **kwargs):
    dir_path = os.path.dirname(os.path.realpath(__file__))
    hello_path = os.path.join(dir_path, "hello.py")
    run_chainlit(hello_path)


@cli.command("login")
@click.argument("args", nargs=-1)
def chainlit_login(args=None, **kwargs):
    login()
    sys.exit(0)


@cli.command("logout")
@click.argument("args", nargs=-1)
def chainlit_logout(args=None, **kwargs):
    logout()
    sys.exit(0)


@cli.command("init")
@click.argument("args", nargs=-1)
def chainlit_init(args=None, **kwargs):
    init_config(log=True)
