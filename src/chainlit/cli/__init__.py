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
from chainlit.telemetry import trace_event
from chainlit.logger import logger


# Create the main command group for Chainlit CLI
@click.group(context_settings={"auto_envvar_prefix": "CHAINLIT"})
@click.version_option(prog_name="Chainlit")
def cli():
    return


# Define the function to run Chainlit with provided options
def run_chainlit(target: str, watch=False, headless=False, debug=False):
    DEFAULT_HOST = "0.0.0.0"
    DEFAULT_PORT = 8000
    host = os.environ.get("CHAINLIT_HOST", DEFAULT_HOST)
    port = int(os.environ.get("CHAINLIT_PORT", DEFAULT_PORT))

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
        if not headless:
            if host == DEFAULT_HOST:
                url = f"http://localhost:{port}"
            else:
                url = f"http://{host}:{port}"
            # Wait two seconds to allow the server to start
            socketio.sleep(2)

            logger.info(f"Your app is available at {url}")
            webbrowser.open(url)

    socketio.start_background_task(open_browser, headless)
    # Start the server
    socketio.run(app, host=host, port=port, debug=debug, use_reloader=False)


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

        # Set the openai api key to a fake value
        import os

        os.environ["OPENAI_API_KEY"] = "sk-FAKE-OPENAI-API-KEY"

        # Mock the openai api
        import responses

        responses.start()
        jsonReply = {
            "id": "cmpl-uqkvlQyYK7bGYrRHQ0eXlWi7",
            "object": "text_completion",
            "created": 1589478378,
            "model": "text-davinci-003",
            "choices": [
                {
                    "text": "\n\n```text\n3*3\n```",
                    "index": 0,
                    "logprobs": None,
                    "finish_reason": "length",
                }
            ],
            "usage": {
                "prompt_tokens": 5,
                "completion_tokens": 7,
                "total_tokens": 12,
            },
        }
        responses.add(
            responses.POST,
            "https://api.openai.com/v1/completions",
            json=jsonReply,
        )

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
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    hello_path = os.path.join(dir_path, "hello.py")
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
