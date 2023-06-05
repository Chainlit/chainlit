import click
import os
import sys
import uvicorn
import asyncio
import nest_asyncio

nest_asyncio.apply()

from chainlit.config import config, init_config, load_module, package_root
from chainlit.markdown import init_markdown
from chainlit.cli.auth import login, logout
from chainlit.cli.deploy import deploy
from chainlit.cli.utils import check_file
from chainlit.telemetry import trace_event
from chainlit.logger import logger
from chainlit.server import app

# from chainlit.watch import watch_directory


# Create the main command group for Chainlit CLI
@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.version_option(prog_name="Chainlit")
def cli():
    return


# Define the function to run Chainlit with provided options
def run_chainlit(target: str, watch=False, headless=False, debug=False):
    host = os.environ.get("CHAINLIT_HOST", config.run_settings.DEFAULT_HOST)
    port = int(os.environ.get("CHAINLIT_PORT", config.run_settings.DEFAULT_PORT))

    config.run_settings.headless = headless
    config.run_settings.host = host
    config.run_settings.port = port

    check_file(target)
    # Load the module provided by the user
    config.module_name = target
    load_module(config.module_name)

    # Create the chainlit.md file if it doesn't exist
    init_markdown(config.root)

    # Enable file watching if the user specified it
    # if watch:
    #     watch_directory()

    # Start the server
    async def start():
        # log_level = "debug" if debug else "info"
        config = uvicorn.Config(app, host=host, port=port, log_level="info")
        server = uvicorn.Server(config)
        await server.serve()

    # Run the asyncio event loop instead of uvloop to enable re entrance
    asyncio.run(start())
    # uvicorn.run(app, host=host, port=port)


# Define the "run" command for Chainlit CLI
@cli.command("run")
@click.argument("target", required=True, envvar="RUN_TARGET")
@click.option("-w", "--watch", default=False, is_flag=True, envvar="WATCH")
@click.option("-h", "--headless", default=False, is_flag=True, envvar="HEADLESS")
@click.option("-d", "--debug", default=False, is_flag=True, envvar="DEBUG")
@click.option("-c", "--ci", default=False, is_flag=True, envvar="CI")
@click.option("--host")
@click.option("--port")
def chainlit_run(target, watch, headless, debug, ci, host, port):
    if host:
        os.environ["CHAINLIT_HOST"] = host
    if port:
        os.environ["CHAINLIT_PORT"] = port
    if ci:
        logger.info("Running in CI mode")
        config.enable_telemetry = False
    else:
        trace_event("chainlit run")

    run_chainlit(target, watch, headless, debug)


@cli.command("deploy")
@click.argument("target", required=True, envvar="CHAINLIT_RUN_TARGET")
@click.argument("args", nargs=-1)
def chainlit_deploy(target, args=None, **kwargs):
    trace_event("chainlit deploy")
    raise NotImplementedError("Deploy is not yet implemented")
    deploy(target)


@cli.command("hello")
@click.argument("args", nargs=-1)
def chainlit_hello(args=None, **kwargs):
    trace_event("chainlit hello")
    hello_path = os.path.join(package_root, "hello.py")
    run_chainlit(hello_path)


@cli.command("login")
@click.argument("args", nargs=-1)
def chainlit_login(args=None, **kwargs):
    trace_event("chainlit login")
    login()
    sys.exit(0)


@cli.command("logout")
@click.argument("args", nargs=-1)
def chainlit_logout(args=None, **kwargs):
    trace_event("chainlit logout")
    logout()
    sys.exit(0)


@cli.command("init")
@click.argument("args", nargs=-1)
def chainlit_init(args=None, **kwargs):
    trace_event("chainlit init")
    init_config(log=True)
