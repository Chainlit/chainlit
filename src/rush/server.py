#!/usr/bin/python3.9
import rush.monkey
from rush.config import config
from typing import Dict, List
from flask import Flask
from flask_socketio import SocketIO, emit
from flask import request
from flask_cors import CORS
from rush.uihandler import UiCallbackHandler
from langchain.agents.agent import AgentExecutor
from langchain import OpenAI
import langchain
from langchain.cache import SQLiteCache
from langchain.callbacks.base import CallbackManager
from langchain.callbacks import OpenAICallbackHandler
from rush.inject import RushInject, DocumentSpec

langchain.llm_cache = SQLiteCache(database_path=".langchain.db")

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

sessions: Dict[str, AgentExecutor] = {}


def capture_mention(string: str, agents: List[str]):
    string = string.lower()
    mention = None
    for agent in agents:
        to_capture = ("@"+agent).lower()
        if to_capture in string:
            string = string.replace(to_capture, "").strip()
            mention = agent
    return string, mention


@app.route('/completion', methods=['POST'])
def completion():
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

    def send_local_image(path: str, spec: DocumentSpec):
        with open(path, 'rb') as f:
            image_data = f.read()
            spec["type"] = "image"
            emit('document', {"spec": spec,
                 'content': image_data})

    callback_manager = CallbackManager(
        [UiCallbackHandler(emit, config.bot_name), OpenAICallbackHandler()])


    rush_inject = RushInject(
        callback_manager=callback_manager, send_local_image=send_local_image)

    module = __import__(config.module)
    #TODO lock config object until inject release
    config.inject = rush_inject

    if not hasattr(module, "load_agent"):
        raise ValueError("File does not expose a load_agent function")

    load_agent = module.load_agent

    id = request.sid

    sessions[id] = load_agent()

    config.inject = None

    agent = sessions[id]

    tools = agent.tools

    agents = [{"id": tool.name, "display": tool.name, "description": tool.description}
              for tool in tools]

    emit("agents", agents)


@socketio.on('message')
def message(message):
    id = request.sid
    agent = sessions[id]
    if not agent:
        return

    agent.callback_manager.handlers[0].reset_memory()

    input = message["data"].strip()
    tools = agent.tools
    agents = [tool.name for tool in tools]
    input, agent_mention = capture_mention(input, agents)

    if agent_mention:
        agent_to_call_list = [
            tool for tool in tools if tool.name == agent_mention]
        agent_to_call = agent_to_call_list[0]

        agent_name = agent_mention
    else:
        agent_to_call = agent
        agent_name = config.bot_name

    agent.callback_manager.handlers[0].tool_sequence = [agent_name]

    try:

        res = agent_to_call({"input": input})['output']

        emit("message", {
            "author": agent_name,
            "content": res,
            "indent": 0,
            "final": True,
        })
        # emit("debug", agent.callback_manager.handlers[0].memory or None)
        emit("total_tokens", agent.callback_manager.handlers[1].total_tokens)
    except Exception as e:
        emit("message", {
            "author": agent_name,
            "content": f"Error: {str(e)}",
            "indent": 0,
            "error": True
        })


def run():
    return socketio.run(app)
