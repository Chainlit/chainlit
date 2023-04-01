from flask_cors import CORS
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO
from chainlit.config import config
from chainlit.lc.utils import run_agent
from chainlit.session import Session, sessions
from chainlit.env import UserEnv, SDK
from chainlit.client import CloudClient, LocalClient
from chainlit.sdk import Chainlit
import os
import json


root_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(root_dir, "frontend/dist")

app = Flask(__name__, static_folder=build_dir)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if config.headless:
        return "Headless"
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


@app.route('/completion', methods=['POST'])
def completion():
    from langchain import OpenAI
    # todo use api instead of langchain
    # todo env
    data = request.json
    llm_settings = data["settings"]
    if "stop" in llm_settings:
        stop = llm_settings.pop("stop")
    else:
        stop = None
    llm = OpenAI(**llm_settings)
    completion = llm(data["prompt"], stop=stop)
    return completion


@app.route('/project/settings', methods=['GET'])
def project_settings():
    return {"anonymous": not config.auth, "projectId": config.project_id, "chainlitServer": config.chainlit_server, "userEnv": config.user_env}


@socketio.on('connect')
def connect():
    session_id = request.sid
    client = None
    user_env = None
    conversation_id = sessions.get(session_id, {}).get("conversation_id")

    if config.user_env:
        if request.headers.get("user-env"):
            user_env["user_env"] = json.loads(request.headers.get("user-env"))
        else:
            return False

    if config.auth:
        access_token = request.headers.get("Authorization")
        if not config.project_id or not access_token:
            return False
        client = CloudClient(project_id=config.project_id, access_token=access_token,
                             url=config.chainlit_server)
        try:
            if not conversation_id:
                conversation_id = client.create_conversation(session_id)
        except Exception as e:
            print("Connection refused:", e)
            return False
    # elif config.chainlit_env == "development":
    #     client = LocalClient(project_id=config.module_name)
    #     if not conversation_id:
    #         conversation_id = client.create_conversation(session_id)

    def _emit(event, data):
        socketio.emit(event, data, to=session_id)

    session = {
        "emit": _emit,
        "client": client,
        "conversation_id": conversation_id,
        "user_env": user_env
    }  # type: Session
    sessions[session_id] = session

    if not hasattr(config.module, "load_agent"):
        load_agent = None
    else:
        load_agent = config.module.load_agent
        with UserEnv(session["user_env"]):
            agent = load_agent()
            session["agent"] = agent

        # if hasattr(agent, "tools"):
        #     tools = agent.tools
        #     agents = [{"id": tool.name, "display": tool.name, "description": tool.description}
        #               for tool in tools]
        #     emit("agents", agents)

    if not hasattr(config.module, "predict"):
        predict = None
    else:
        predict = config.module.predict
        session["predict"] = predict

    if not load_agent and not predict:
        raise ValueError(
            "Module does not expose a load_agent or predict function")

    if hasattr(config.module, "process_response"):
        session["process_response"] = config.module.process_response


@socketio.on('disconnect')
def disconnect():
    if request.sid in sessions:
        session = sessions.pop(request.sid)


# @socketio.on('message')
@app.route('/message', methods=['POST'])
def message():
    body = request.json
    session_id = body["sessionId"]
    input_str = body["content"].strip()
    author = body["author"]

    session = sessions[session_id]

    if session["client"]:
        session["client"].create_message(
            {
                "conversationId": session["conversation_id"],
                "author": author,
                "content": input_str,
                "authorIsUser": True,
            }
        )

    print("ENTER", session_id)

    sdk = Chainlit(session)

    if "agent" in session:
        agent = session["agent"]
        try:
            from chainlit.lc.callback import LangchainCallback
            with LangchainCallback(sdk):
                with UserEnv(session["user_env"]):
                    with SDK(sdk):
                        raw_res, agent_name, output_key = run_agent(
                            agent, input_str)
        except Exception as e:
            sdk.send_message(author="Error", is_error=True,
                             content=str(e), final=True)
            raise e

        if "process_response" in session:
            with UserEnv(session["user_env"]):
                with SDK(sdk):
                    res = session["process_response"](raw_res)
        elif output_key is not None:
            res = raw_res[output_key]
        else:
            res = raw_res
        sdk.send_message(author=agent_name, content=res, final=True)
        # emit("total_tokens", agent.callback_manager.handlers[1].total_tokens)
    elif "predict" in session:
        with UserEnv(session["user_env"]):
            with SDK(sdk):
                session["predict"](input_str)

    print("EXIT", session_id)
    return {"success": True}

