import os
import json
from flask_cors import CORS
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, ConnectionRefusedError
from chainlit.config import config
from chainlit.lc.utils import run_agent
from chainlit.session import Session, sessions
from chainlit.client import CloudClient
from chainlit.sdk import Chainlit
from chainlit.markdown import get_markdown_str

root_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(root_dir, "frontend/dist")

app = Flask(__name__, static_folder=build_dir)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="gevent")

# Serve static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Handle completion requests
@app.route('/completion', methods=['POST'])
def completion():
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
            **llm_settings
        )
        return response["choices"][0]["text"]

# Get project settings
@app.route('/project/settings', methods=['GET'])
def project_settings():
    return {
        "public": config.public,
        "projectId": config.project_id,
        "chainlitServer": config.chainlit_server,
        "userEnv": config.user_env,
        "chainlitMd": get_markdown_str(config.root),
        "dev": config.chainlit_env == "development",
    }

def _on_chat_start(user_env, session):
    __chainlit_sdk__ = Chainlit(session)
    config.on_chat_start(user_env)

# Handle socket connection
@socketio.on('connect')
def connect():
    session_id = request.sid
    client = None
    user_env = {}

    if config.user_env:
        if request.headers.get("user-env"):
            user_env = json.loads(request.headers.get("user-env"))
        else:
            raise ConnectionRefusedError("Missing user environment")

    access_token = request.headers.get("Authorization")
    if not config.public and not access_token:
        raise ConnectionRefusedError("No access token provided")
    elif access_token and config.project_id:
        client = CloudClient(project_id=config.project_id, access_token=access_token,
                             url=config.chainlit_server)

    def _emit(event, data):
        socketio.emit(event, data, to=session_id)

    def _ask_user(data, timeout):
        return socketio.call("ask", data, timeout=timeout, to=session_id)

    session = {
        "id": session_id,
        "emit": _emit,
        "ask_user": _ask_user,
        "client": client,
        "conversation_id": None,
        "user_env": user_env
    }  # type: Session
    sessions[session_id] = session

    if config.lc_factory:
        __chainlit_sdk__ = Chainlit(session)
        agent = config.lc_factory(user_env)
        session["agent"] = agent

    if not config.lc_factory and not config.on_message and not config.on_chat_start:
        raise ValueError(
            "Module should at least expose one of @langchain_factory, @on_message or @on_chat_start function")
    
    if config.on_chat_start:
        task = socketio.start_background_task(_on_chat_start, user_env, session)
        session["task"] = task

# Handle socket disconnection
@socketio.on('disconnect')
def disconnect():
    if request.sid in sessions:
        session = sessions.pop(request.sid)
        if session.get("task"):
            session["task"].kill()
            session["task"].join()

# Handle stop event
@socketio.on('stop')
def stop():
    session = sessions.get(request.sid)
    if not session:
        return

    task = session.get("task")

    if task:
        __chainlit_sdk__ = Chainlit(session)

        if config.on_stop:
            config.on_stop(session["user_env"])

        __chainlit_sdk__.send_message(
            author="System", content="Conversation stopped by the user.")

        task.kill()
        task.join()
        session["task"] = None

# Process message
def process_message(session: Session, input_str: str):
    __chainlit_sdk__ = Chainlit(session)
    try:
        __chainlit_sdk__.task_start()
        if "agent" in session:
            agent = session["agent"]
            if agent is None:
                raise ValueError("LangChain agent is None")
            raw_res, agent_name, output_key = run_agent(
                agent, input_str)

            if config.lc_postprocess:
                res = config.lc_postprocess(raw_res, session["user_env"])
            elif output_key is not None:
                res = raw_res[output_key]
            else:
                res = raw_res
            __chainlit_sdk__.send_message(
                author=agent_name, content=res)
        elif config.on_message:
            config.on_message(input_str, session["user_env"])
    except Exception as e:
        __chainlit_sdk__.send_message(author="Error", is_error=True,
                                      content=str(e))
    finally:
        __chainlit_sdk__.task_end()

# Handle message event
@app.route('/message', methods=['POST'])
def message():
    body = request.json
    session_id = body["sessionId"]
    input_str = body["content"].strip()
    author = body["author"]

    session = sessions[session_id]
    if session["client"]:
        if not session["conversation_id"]:
            session["conversation_id"] = session["client"].create_conversation(
                session_id)

        session["client"].create_message(
            {
                "conversationId": session["conversation_id"],
                "author": author,
                "content": input_str,
                "authorIsUser": True,
            }
        )

    task = socketio.start_background_task(process_message, session, input_str)
    session["task"] = task
    task.join()
    session["task"] = None

    return {"success": True}
