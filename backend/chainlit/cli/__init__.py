import asyncio
import os

import click
import nest_asyncio
import uvicorn

nest_asyncio.apply()

from chainlit.auth import ensure_jwt_secret
from chainlit.cache import init_lc_cache
from chainlit.cli.utils import check_file
from chainlit.config import (
    BACKEND_ROOT,
    DEFAULT_HOST,
    DEFAULT_PORT,
    config,
    init_config,
    load_module,
)
from chainlit.logger import logger
from chainlit.markdown import init_markdown
from chainlit.secret import random_secret
from chainlit.server import app, register_wildcard_route_handler
from chainlit.telemetry import trace_event


# Create the main command group for Chainlit CLI
@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.version_option(prog_name="Chainlit")
def cli():
    return


# Define the function to run Chainlit with provided options
def run_chainlit(target: str):
    host = os.environ.get("CHAINLIT_HOST", DEFAULT_HOST)
    port = int(os.environ.get("CHAINLIT_PORT", DEFAULT_PORT))

    ws_per_message_deflate_env = os.environ.get(
        "UVICORN_WS_PER_MESSAGE_DEFLATE", "true"
    )
    ws_per_message_deflate = ws_per_message_deflate_env.lower() in [
        "true",
        "1",
        "yes",
    ]  # Convert to boolean

    config.run.host = host
    config.run.port = port

    check_file(target)
    # Load the module provided by the user
    config.run.module_name = target
    load_module(config.run.module_name)

    ensure_jwt_secret()

    register_wildcard_route_handler()

    # Create the chainlit.md file if it doesn't exist
    init_markdown(config.root)

    # Initialize the LangChain cache if installed and enabled
    init_lc_cache()

    log_level = "debug" if config.run.debug else "error"

    # Start the server
    async def start():
        config = uvicorn.Config(
            app,
            host=host,
            port=port,
            log_level=log_level,
            ws_per_message_deflate=ws_per_message_deflate,
        )
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
@click.option("--host", help="Specify a different host to run the server on")
@click.option("--port", help="Specify a different port to run the server on")
def chainlit_run(target, watch, headless, debug, ci, no_cache, host, port):
    if host:
        os.environ["CHAINLIT_HOST"] = host
    if port:
        os.environ["CHAINLIT_PORT"] = port
    if ci:
        logger.info("Running in CI mode")

        config.project.enable_telemetry = False
        no_cache = True
        # This is required to have OpenAI LLM providers available for the CI run
        os.environ["OPENAI_API_KEY"] = "sk-FAKE-OPENAI-API-KEY"
        # This is required for authenticationt tests
        os.environ["CHAINLIT_AUTH_SECRET"] = "SUPER_SECRET"
    else:
        trace_event("chainlit run")

    config.run.headless = headless
    config.run.debug = debug
    config.run.no_cache = no_cache
    config.run.ci = ci
    config.run.watch = watch

    run_chainlit(target)


@cli.command("hello")
@click.argument("args", nargs=-1)
def chainlit_hello(args=None, **kwargs):
    trace_event("chainlit hello")
    hello_path = os.path.join(BACKEND_ROOT, "hello.py")
    run_chainlit(hello_path)


@cli.command("init")
@click.argument("args", nargs=-1)
def chainlit_init(args=None, **kwargs):
    trace_event("chainlit init")
    init_config(log=True)


@cli.command("create-secret")
@click.argument("args", nargs=-1)
def chainlit_create_secret(args=None, **kwargs):
    trace_event("chainlit secret")

    print(
        f"Copy the following secret into your .env file. Once it is set, changing it will logout all users with active sessions.\nCHAINLIT_AUTH_SECRET={random_secret()}"
    )
