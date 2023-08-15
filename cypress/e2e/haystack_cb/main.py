from haystack.agents import Agent, Tool
from haystack.agents.agent_step import AgentStep
from haystack.nodes import PromptNode

import chainlit as cl
from chainlit.haystack.callbacks import HaystackAgentCallbackHandler


@cl.on_chat_start
async def start():
    await cl.Message(content="HaystackCb").send()

    fake_prompt_node = PromptNode(model_name_or_path="gpt-3.5-turbo", api_key="fakekey")

    agent = Agent(fake_prompt_node)
    cb = HaystackAgentCallbackHandler(agent)

    cb.on_agent_start(name="agent")

    cb.on_new_token("First Step")

    cb.on_agent_step(AgentStep())

    cb.on_new_token("Second Step")

    cb.on_agent_step(AgentStep())

    cb.on_tool_start("tool input", Tool("tool", fake_prompt_node, "Tool description"))
    cb.on_tool_finish("tool result", "tool name", "tool input")

    cb.on_new_token("Third Step")

    cb.on_agent_finish(AgentStep())
