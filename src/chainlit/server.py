import sys
import os
if 'langchain' in sys.modules:
    from chainlit.lc import monkey

from chainlit.lc.utils import run_agent
from chainlit.config import config
from chainlit.sdk import Chainlit
from typing import Dict, TypedDict, Optional, Callable, Any
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit
from flask import request
from flask_cors import CORS
from langchain import OpenAI

root_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(root_dir, "frontend/dist")

app = Flask(__name__, static_folder=build_dir)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


class Session(TypedDict):
    agent: Any
    predict: Optional[Callable[[str], str]]
    process_response: Optional[Callable[[Any], str]]


sessions: Dict[str, Session] = {}


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


@socketio.on('connect')
def connect():
    if not config.module:
        raise ValueError("Missing module")

    session = {}  # type: Session
    module = __import__(config.module)

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

    id = request.sid
    sessions[id] = session


@socketio.on('message')
def message(message):
    input_str = message["data"].strip()

    id = request.sid
    session = sessions[id]

    if "agent" in session:
        sdk = Chainlit(emit=emit)
        agent = session["agent"]
        raw_res, agent_name, output_key = run_agent(agent, input_str)
        if "process_response" in session:
            res = session["process_response"](raw_res)
        else:
            res = raw_res[output_key]
        sdk.send_message(author=agent_name, content=res, final=True)
        emit("total_tokens", agent.callback_manager.handlers[1].total_tokens)
    elif "predict" in session:
        session["predict"](input_str)
        return


def run():
    socketio.run(app)
