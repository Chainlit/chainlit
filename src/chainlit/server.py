from flask_cors import CORS
from flask import request
from flask_socketio import SocketIO, emit
from flask import Flask, send_from_directory
from chainlit import Chainlit
from chainlit.config import config
from chainlit.lc.utils import run_agent
from chainlit.session import Session, sessions
from chainlit.client import CloudClient, LocalClient
import sys
import os
import importlib.util

LANGCHAIN_INSTALLED = 'langchain' in sys.modules
if LANGCHAIN_INSTALLED:
    from chainlit.lc import monkey


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
    return {"anonymous": not config.auth, "projectId": config.project_id, "chainlitServer": config.chainlit_server}


@socketio.on('connect')
def connect():
    if not config.module:
        raise ValueError("Missing module")

    session_id = request.sid
    client = None
    conversation_id = sessions.get(session_id, {}).get("conversation_id")

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
    #     client = LocalClient(project_id=config.module)
    #     if not conversation_id:
    #         conversation_id = client.create_conversation(session_id)

    session = {"emit": emit, "client": client,
               "conversation_id": conversation_id}  # type: Session
    sessions[session_id] = session

    spec = importlib.util.spec_from_file_location(session_id, config.module)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    if not hasattr(module, "load_agent"):
        load_agent = None
    else:
        load_agent = module.load_agent
        agent = load_agent()
        session["agent"] = agent
        if hasattr(agent, "tools"):
            tools = agent.tools
            agents = [{"id": tool.name, "display": tool.name, "description": tool.description}
                      for tool in tools]
            emit("agents", agents)

    if not hasattr(module, "predict"):
        predict = None
    else:
        predict = module.predict
        session["predict"] = predict

    if not load_agent and not predict:
        raise ValueError(
            "Module does not expose a load_agent or predict function")

    if hasattr(module, "process_response"):
        session["process_response"] = module.process_response


@socketio.on('disconnect')
def disconnect():
    if request.sid in sessions:
        session = sessions.pop(request.sid)


@socketio.on('message')
def message(message):
    input_str = message["content"].strip()
    author = message["author"]

    id = request.sid
    session = sessions[id]

    if session["client"]:
        session["client"].create_message(
            {
                "conversationId": session["conversation_id"],
                "author": author,
                "content": input_str,
                "authorIsUser": True,
            }
        )

    if "agent" in session:
        sdk = Chainlit(session)
        agent = session["agent"]
        try:
            raw_res, agent_name, output_key = run_agent(agent, input_str)
        except Exception as e:
            sdk.send_message(author="Chainlit", content=str(e), final=True)
            return

        if "process_response" in session:
            res = session["process_response"](raw_res)
        elif output_key is not None:
            res = raw_res[output_key]
        else:
            res = raw_res
        sdk.send_message(author=agent_name, content=res, final=True)
        emit("total_tokens", agent.callback_manager.handlers[1].total_tokens)
    elif "predict" in session:
        session["predict"](input_str)
        return


def run():
    if LANGCHAIN_INSTALLED:
        import langchain
        from langchain.cache import SQLiteCache
        if config.lc_cache_path:
            langchain.llm_cache = SQLiteCache(
                database_path=config.lc_cache_path)

    socketio.run(app, port=5000)
