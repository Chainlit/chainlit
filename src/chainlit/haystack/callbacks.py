from typing import Any, Optional

import chainlit as cl
from chainlit.config import config
from chainlit.context import get_emitter
from chainlit.emitter import ChainlitEmitter

from haystack.agents.agent_step import AgentStep
from haystack.agents import Agent, Tool


class HaystackCallbackHandler:
    emitter: ChainlitEmitter

    def __init__(self, agent: Agent):
        agent.callback_manager.on_agent_start += self.on_agent_start
        agent.callback_manager.on_agent_step += self.on_agent_step
        agent.callback_manager.on_agent_finish += self.on_agent_finish
        agent.callback_manager.on_new_token += self.on_new_token

        agent.tm.callback_manager.on_tool_start += self.on_tool_start
        agent.tm.callback_manager.on_tool_finish += self.on_tool_finish
        agent.tm.callback_manager.on_tool_error += self.on_tool_error

    def get_root_message_id(self):
        self.emitter = self.emitter if hasattr(self, 'emitter') else get_emitter()

        if not self.emitter.session.root_message:
            root_message = cl.Message(author=config.ui.name, content="")
            cl.run_sync(root_message.send())

        return self.emitter.session.root_message.id

    def on_agent_start(self, **kwargs: Any) -> None:
        # Prepare agent step message for streaming
        self.agent_name = kwargs.get('name', 'Agent')
        self.agent_message = cl.Message(author=self.agent_name, parent_id=self.get_root_message_id(), content="")

    def on_agent_step(self, agent_step: AgentStep, **kwargs: Any) -> None:
        # Send previous (streamed) agent step message
        cl.run_sync(self.agent_message.send())

        # Create next agent step message for streaming
        self.previous_agent_message = self.agent_message
        self.agent_message = cl.Message(author=self.agent_name, parent_id=self.get_root_message_id(), content="")

    def on_agent_finish(self, agent_step: AgentStep, **kwargs: Any):
        # Send previous (streamed) agent step message
        cl.run_sync(self.agent_message.send())
        self.agent_message = None
        self.previous_agent_message = None

    def on_new_token(self, token, **kwargs: Any):
        # Stream agent step tokens
        cl.run_sync(self.agent_message.stream_token(token))

    def on_tool_start(self, tool_input: str, tool: Tool, **kwargs: Any):
        # Tool started, create message
        self.tool_message = cl.Message(author=tool.name, parent_id=self.previous_agent_message.id, content="")

    def on_tool_finish(
        self, tool_result: str, tool_name: Optional[str] = None, tool_input: Optional[str] = None, **kwargs: Any
    ) -> None:
        # Tool finished, send message with tool_result
        self.tool_message.content = tool_result
        cl.run_sync(self.tool_message.send())
        self.tool_message = None

    def on_tool_error(self, exception: Exception, tool: Tool, **kwargs: Any):
        # Tool error, send error message
        cl.run_sync(self.tool_message.remove())
        cl.run_sync(cl.ErrorMessage(str(exception), author=tool.name).send())
        self.tool_message = None