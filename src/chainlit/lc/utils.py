from typing import List, Any
from chainlit.config import config


def capture_mention(string: str, agents: List[str]):
    string = string.lower()
    mention = None
    for agent in agents:
        to_capture = ("@"+agent).lower()
        if to_capture in string:
            string = string.replace(to_capture, "").strip()
            mention = agent
    return string, mention


def run_agent(agent: Any, input_str: str):
    if hasattr(agent, "tools"):
        tools = agent.tools
        agents = [tool.name for tool in tools]
        input_str, agent_mention = capture_mention(input_str, agents)

        agent_to_call_list = [
            tool for tool in tools if tool.name == agent_mention]
        if agent_to_call_list:
            agent_to_call = agent_to_call_list[0]
            agent_name = agent_mention
            agent.callback_manager.handlers[0].tool_sequence = [agent_name]
        else:
            agent_to_call = agent
            agent_name = config.chatbot_name
    else:
        agent_to_call = agent
        agent_name = config.chatbot_name

    if hasattr(agent_to_call, "input_keys"):
        input_key = agent_to_call.input_keys[0]
        raw_res = agent_to_call({input_key: input_str})
    else:
        raw_res = agent_to_call(input_str)

    if hasattr(agent_to_call, "output_keys"):
        output_key = agent_to_call.output_keys[0]
    else:
        output_key = None

    return raw_res, agent_name, output_key
