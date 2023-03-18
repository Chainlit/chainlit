#!/usr/bin/python3.9
import rush.monkey
from rush.config import config
from rush.sdk import Rush
from typing import Dict, List, TypedDict, Optional, Callable, Any
from flask import Flask
from flask_socketio import SocketIO, emit
from flask import request
from flask_cors import CORS
from langchain import OpenAI
import langchain
from langchain.cache import SQLiteCache

langchain.llm_cache = SQLiteCache(database_path=".langchain.db")

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


class Session(TypedDict):
    agent: Any
    predict: Optional[Callable[[str], str]]
    process_response: Optional[Callable[[Any], str]]


sessions: Dict[str, Session] = {}


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


def run_agent(agent: Any, input_str: str):
    agent.callback_manager.handlers[0].reset_memory()

    if hasattr(agent, "tools"):
        tools = agent.tools
        agents = [tool.name for tool in tools]
        input_str, agent_mention = capture_mention(input_str, agents)

        agent_to_call_list = [
            tool for tool in tools if tool.name == agent_mention]
        if agent_to_call_list:
            agent_to_call = agent_to_call_list[0]
            agent_name = agent_mention
        else:
            agent_to_call = agent
            agent_name = config.bot_name  
    else:
        agent_to_call = agent
        agent_name = config.bot_name

    agent.callback_manager.handlers[0].tool_sequence = [agent_name]

    input_key = agent_to_call.input_keys[0]
    raw_res = agent_to_call({input_key: input_str})
    output_key = agent_to_call.output_keys[0]
    return raw_res, agent_name, output_key


@socketio.on('message')
def message(message):
    input_str = message["data"].strip()

    id = request.sid
    session = sessions[id]

    if "agent" in session:
        sdk = Rush(emit=emit)
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
    return socketio.run(app)
