import os
import json
from flask_cors import CORS
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, ConnectionRefusedError
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from chainlit.config import config
from chainlit.lc.utils import run_langchain_agent
from chainlit.session import Session, sessions
from chainlit.user_session import user_sessions
from chainlit.client import CloudClient
from chainlit.sdk import Chainlit
from chainlit.markdown import get_markdown_str
from chainlit.action import Action
from chainlit.telemetry import trace, trace_event
from chainlit.logger import logger

root_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(root_dir, "frontend/dist")

app = Flask(__name__, static_folder=build_dir)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent")

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    """Serve the UI."""
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


@app.route("/completion", methods=["POST"])
@limiter.limit(config.request_limit)
@trace
def completion():
    """Handle a completion request from the prompt playground."""

    import openai

    data = request.json
    llm_settings = data["settings"]
    user_env = data.get("userEnv", {})

    api_key = user_env.get("OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY"))

    stop = llm_settings.pop("stop", None)
    model_name = llm_settings.pop("model_name", None)

    if model_name in ["gpt-3.5-turbo", "gpt-4"]:
        response = openai.ChatCompletion.create(
            api_key=api_key,
            model=model_name,
            messages=[{"role": "user", "content": data["prompt"]}],
            stop=stop,
            **llm_settings,
        )
        return response["choices"][0]["message"]["content"]
    else:
        response = openai.Completion.create(
            api_key=api_key,
            model=model_name,
            prompt=data["prompt"],
            stop=stop,
            **llm_settings,
        )
        return response["choices"][0]["text"]


@app.route("/project/settings", methods=["GET"])
def project_settings():
    """Return project settings. This is called by the UI before the establishing the websocket connection."""
    return {
        "public": config.public,
        "projectId": config.project_id,
        "chainlitServer": config.chainlit_server,
        "userEnv": config.user_env,
        "hideCot": config.hide_cot,
        "chainlitMd": get_markdown_str(config.root),
        "prod": bool(config.chainlit_prod_url),
        "appTitle": config.chatbot_name,
        "github": config.github,
    }


@socketio.on("connect")
def connect():
    """Handle socket connection."""
    session_id = request.sid
    client = None
    user_env = {}

    if config.user_env:
        # Check if requested user environment variables are provided
        if request.headers.get("user-env"):
            user_env = json.loads(request.headers.get("user-env"))
            for key in config.user_env:
                if key not in user_env:
                    trace_event("missing_user_env")
                    raise ConnectionRefusedError(
                        "Missing user environment variable: " + key
                    )

    access_token = request.headers.get("Authorization")
    if not config.public and not access_token:
        # Refuse connection if the app is private and no access token is provided
        trace_event("no_access_token")
        raise ConnectionRefusedError("No access token provided")
    elif access_token and config.project_id:
        # Create the cloud client
        client = CloudClient(
            project_id=config.project_id,
            session_id=session_id,
            access_token=access_token,
            url=config.chainlit_server,
        )

    # Function to send a message to this particular session
    def _emit(event, data):
        socketio.emit(event, data, to=session_id)

    # Function to ask the user a question
    def _ask_user(data, timeout):
        return socketio.call("ask", data, timeout=timeout, to=session_id)

    session = {
        "id": session_id,
        "emit": _emit,
        "ask_user": _ask_user,
        "client": client,
        "user_env": user_env,
    }  # type: Session
    sessions[session_id] = session

    if not config.lc_factory and not config.on_message and not config.on_chat_start:
        raise ValueError(
            "Module should at least expose one of @langchain_factory, @on_message or @on_chat_start function"
        )

    if config.lc_factory:

        def instantiate_agent(session):
            """Instantiate the langchain agent and store it in the session."""
            __chainlit_sdk__ = Chainlit(session)
            agent = config.lc_factory()
            session["agent"] = agent

        # Instantiate the agent in a background task since the connection is not yet accepted
        task = socketio.start_background_task(instantiate_agent, session)
        session["task"] = task

    if config.on_chat_start:

        def _on_chat_start(session):
            """Call the on_chat_start function provided by the developer."""
            __chainlit_sdk__ = Chainlit(session)
            config.on_chat_start()

        # Send the ask in a backgroudn task since the connection is not yet accepted
        task = socketio.start_background_task(_on_chat_start, session)
        session["task"] = task

    trace_event("connection_successful")


@socketio.on("disconnect")
def disconnect():
    """Handle socket disconnection."""

    if request.sid in sessions:
        # Clean up the session
        session = sessions.pop(request.sid)
        task = session.get("task")
        if task:
            # If a background task is running, kill it
            task.kill()

    if request.sid in user_sessions:
        # Clean up the user session
        user_sessions.pop(request.sid)


@socketio.on("stop")
def stop():
    """Handle a stop request from the client."""
    trace_event("stop_task")
    session = sessions.get(request.sid)
    if not session:
        return

    task = session.get("task")

    if task:
        task.kill()
        session["task"] = None

        __chainlit_sdk__ = Chainlit(session)

        if config.on_stop:
            config.on_stop()

        __chainlit_sdk__.send_message(
            author="System", content="Conversation stopped by the user."
        )


def need_session(id: str):
    """Return the session with the given id."""

    session = sessions.get(id)
    if not session:
        raise ValueError("Session not found")
    return session


def process_message(session: Session, author: str, input_str: str):
    """Process a message from the user."""

    __chainlit_sdk__ = Chainlit(session)
    try:
        __chainlit_sdk__.task_start()

        if session["client"]:
            # If cloud is enabled, persist the message
            session["client"].create_message(
                {
                    "author": author,
                    "content": input_str,
                    "authorIsUser": True,
                }
            )

        langchain_agent = session.get("agent")
        if langchain_agent:
            # If a langchain agent is available, run it
            if config.lc_run:
                # If the developer provided a custom run function, use it
                config.lc_run(langchain_agent, input_str)
                return
            else:
                # Otherwise, use the default run function
                raw_res, output_key = run_langchain_agent(langchain_agent, input_str)

                if config.lc_postprocess:
                    # If the developer provided a custom postprocess function, use it
                    config.lc_postprocess(raw_res)
                    return
                elif output_key is not None:
                    # Use the output key if provided
                    res = raw_res[output_key]
                else:
                    # Otherwise, use the raw response
                    res = raw_res
            # Finally, send the response to the user
            __chainlit_sdk__.send_message(author=config.chatbot_name, content=res)

        elif config.on_message:
            # If no langchain agent is available, call the on_message function provided by the developer
            config.on_message(input_str)
    except Exception as e:
        logger.exception(e)
        __chainlit_sdk__.send_message(author="Error", is_error=True, content=str(e))
    finally:
        __chainlit_sdk__.task_end()


@app.route("/message", methods=["POST"])
@limiter.limit(config.request_limit)
@trace
def message():
    """Handle a message from the UI."""

    body = request.json
    session_id = body["sessionId"]
    input_str = body["content"].strip()
    author = body["author"]

    session = need_session(session_id)

    task = socketio.start_background_task(process_message, session, author, input_str)
    session["task"] = task
    task.join()
    session["task"] = None

    return {"success": True}


def process_action(session: Session, action: Action):
    __chainlit_sdk__ = Chainlit(session)
    callback = config.action_callbacks.get(action.name)
    if callback:
        callback(action)
    else:
        logger.warning("No callback found for action %s", action.name)


@app.route("/action", methods=["POST"])
@limiter.limit(config.request_limit)
@trace
def on_action():
    """Handle an action call from the UI."""

    body = request.json
    session_id = body["sessionId"]
    action = Action(**body["action"])

    session = need_session(session_id)

    task = socketio.start_background_task(process_action, session, action)
    session["task"] = task
    task.join()
    session["task"] = None

    return {"success": True}
