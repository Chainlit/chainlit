from typing import Any, Generic, List, Optional, TypeVar

from haystack.agents import Agent, Tool
from haystack.agents.agent_step import AgentStep

import chainlit as cl
from chainlit.config import config
from chainlit.context import context

T = TypeVar("T")


class Stack(Generic[T]):
    def __init__(self) -> None:
        self.items: List[T] = []

    def __len__(self):
        return len(self.items)

    def push(self, item: T) -> None:
        self.items.append(item)

    def pop(self) -> T:
        return self.items.pop()

    def peek(self) -> T:
        return self.items[-1]

    def clear(self) -> None:
        self.items.clear()


class HaystackAgentCallbackHandler:
    stack: Stack[cl.Message]
    latest_agent_message: Optional[cl.Message]

    def __init__(self, agent: Agent):
        agent.callback_manager.on_agent_start += self.on_agent_start
        agent.callback_manager.on_agent_step += self.on_agent_step
        agent.callback_manager.on_agent_finish += self.on_agent_finish
        agent.callback_manager.on_new_token += self.on_new_token

        agent.tm.callback_manager.on_tool_start += self.on_tool_start
        agent.tm.callback_manager.on_tool_finish += self.on_tool_finish
        agent.tm.callback_manager.on_tool_error += self.on_tool_error

    def get_root_message(self):
        if not context.session.root_message:
            root_message = cl.Message(author=config.ui.name, content="")
            cl.run_sync(root_message.send())

        return context.session.root_message

    def on_agent_start(self, **kwargs: Any) -> None:
        # Prepare agent step message for streaming
        self.agent_name = kwargs.get("name", "Agent")
        self.stack = Stack[cl.Message]()
        self.stack.push(self.get_root_message())

        agent_message = cl.Message(
            author=self.agent_name, parent_id=self.stack.peek().id, content=""
        )
        self.stack.push(agent_message)

    # This method is called when a step has finished
    def on_agent_step(self, agent_step: AgentStep, **kwargs: Any) -> None:
        # Send previous agent step message
        self.latest_agent_message = self.stack.pop()

        # If token streaming is disabled
        if self.latest_agent_message.content == "":
            self.latest_agent_message.content = agent_step.prompt_node_response

        cl.run_sync(self.latest_agent_message.send())

        if not agent_step.is_last():
            # Prepare message for next agent step
            agent_message = cl.Message(
                author=self.agent_name, parent_id=self.stack.peek().id, content=""
            )
            self.stack.push(agent_message)

    def on_agent_finish(self, agent_step: AgentStep, **kwargs: Any) -> None:
        self.latest_agent_message = None
        self.stack.clear()

    def on_new_token(self, token, **kwargs: Any) -> None:
        # Stream agent step tokens
        cl.run_sync(self.stack.peek().stream_token(token))

    def on_tool_start(self, tool_input: str, tool: Tool, **kwargs: Any) -> None:
        # Tool started, create message
        parent_id = self.latest_agent_message.id if self.latest_agent_message else None
        tool_message = cl.Message(author=tool.name, parent_id=parent_id, content="")
        self.stack.push(tool_message)

    def on_tool_finish(
        self,
        tool_result: str,
        tool_name: Optional[str] = None,
        tool_input: Optional[str] = None,
        **kwargs: Any
    ) -> None:
        # Tool finished, send message with tool_result
        tool_message = self.stack.pop()
        tool_message.content = tool_result
        cl.run_sync(tool_message.send())

    def on_tool_error(self, exception: Exception, tool: Tool, **kwargs: Any) -> None:
        # Tool error, send error message
        cl.run_sync(self.stack.pop().remove())
        cl.run_sync(cl.ErrorMessage(str(exception), author=tool.name).send())
