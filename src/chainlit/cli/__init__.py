import click
import os
import sys
import uvicorn
import asyncio
import nest_asyncio

nest_asyncio.apply()

from chainlit.config import (
    config,
    init_config,
    load_module,
    PACKAGE_ROOT,
    DEFAULT_HOST,
    DEFAULT_PORT,
)
from chainlit.markdown import init_markdown
from chainlit.cli.auth import login, logout
from chainlit.cli.deploy import deploy
from chainlit.cli.utils import check_file
from chainlit.telemetry import trace_event
from chainlit.cache import init_lc_cache
from chainlit.db import init_local_db, migrate_local_db
from chainlit.logger import logger
from chainlit.server import app


# Create the main command group for Chainlit CLI
@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.version_option(prog_name="Chainlit")
def cli():
    return


# Define the function to run Chainlit with provided options
def run_chainlit(target: str):
    host = os.environ.get("CHAINLIT_HOST", DEFAULT_HOST)
    port = int(os.environ.get("CHAINLIT_PORT", DEFAULT_PORT))
    config.run.host = host
    config.run.port = port

    check_file(target)
    # Load the module provided by the user
    config.run.module_name = target
    load_module(config.run.module_name)

    # Create the chainlit.md file if it doesn't exist
    init_markdown(config.root)

    # Initialize the LangChain cache if installed and enabled
    init_lc_cache()

    # Initialize the local database if configured to use it
    init_local_db()

    log_level = "debug" if config.run.debug else "error"

    # Start the server
    async def start():
        config = uvicorn.Config(app, host=host, port=port, log_level=log_level)
        server = uvicorn.Server(config)
        await server.serve()

    # Run the asyncio event loop instead of uvloop to enable re entrance
    asyncio.run(start())
    # uvicorn.run(app, host=host, port=port, log_level=log_level)


# Define the "run" command for Chainlit CLI
@cli.command("run")
@click.argument("target", required=True, envvar="RUN_TARGET")
@click.option(
    "-w",
    "--watch",
    default=False,
    is_flag=True,
    envvar="WATCH",
    help="Reload the app when the module changes",
)
@click.option(
    "-h",
    "--headless",
    default=False,
    is_flag=True,
    envvar="HEADLESS",
    help="Will prevent to auto open the app in the browser",
)
@click.option(
    "-d",
    "--debug",
    default=False,
    is_flag=True,
    envvar="DEBUG",
    help="Set the log level to debug",
)
@click.option(
    "-c",
    "--ci",
    default=False,
    is_flag=True,
    envvar="CI",
    help="Flag to run in CI mode",
)
@click.option(
    "--no-cache",
    default=False,
    is_flag=True,
    envvar="NO_CACHE",
    help="Useful to disable third parties cache, such as langchain.",
)
@click.option(
    "--db",
    type=click.Choice(["cloud", "local"]),
    help="Useful to control database mode when running CI.",
)
@click.option("--host", help="Specify a different host to run the server on")
@click.option("--port", help="Specify a different port to run the server on")
def chainlit_run(target, watch, headless, debug, ci, no_cache, db, host, port):
    if host:
        os.environ["CHAINLIT_HOST"] = host
    if port:
        os.environ["CHAINLIT_PORT"] = port
    if ci:
        logger.info("Running in CI mode")

        if db:
            config.project.database = db

        config.project.enable_telemetry = False
        no_cache = True
        from chainlit.cli.mock import mock_openai

        mock_openai()

    else:
        trace_event("chainlit run")

    config.run.headless = headless
    config.run.debug = debug
    config.run.no_cache = no_cache
    config.run.ci = ci
    config.run.watch = watch

    run_chainlit(target)


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
    hello_path = os.path.join(PACKAGE_ROOT, "hello.py")
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


@cli.command("migrate")
@click.argument("args", nargs=-1)
def chainlit_migrate(args=None, **kwargs):
    trace_event("chainlit migrate")
    migrate_local_db()
    sys.exit(0)


@cli.command("init")
@click.argument("args", nargs=-1)
def chainlit_init(args=None, **kwargs):
    trace_event("chainlit init")
    init_config(log=True)
