import re
from typing import Any, Generic, List, Optional, TypeVar

from haystack.agents import Agent, Tool
from haystack.agents.agent_step import AgentStep
from literalai.helper import utc_now

from chainlit import Message
from chainlit.step import Step
from chainlit.sync import run_sync

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
    stack: Stack[Step]
    last_step: Optional[Step]

    def __init__(
        self,
        agent: Agent,
        stream_final_answer: bool = False,
        stream_final_answer_agent_name: str = "Agent",
    ):
        agent.callback_manager.on_agent_start += self.on_agent_start
        agent.callback_manager.on_agent_step += self.on_agent_step
        agent.callback_manager.on_agent_finish += self.on_agent_finish
        agent.callback_manager.on_new_token += self.on_new_token

        agent.tm.callback_manager.on_tool_start += self.on_tool_start
        agent.tm.callback_manager.on_tool_finish += self.on_tool_finish
        agent.tm.callback_manager.on_tool_error += self.on_tool_error

        self.final_answer_pattern = agent.final_answer_pattern
        self.stream_final_answer = stream_final_answer
        self.stream_final_answer_agent_name = stream_final_answer_agent_name

    def on_agent_start(self, **kwargs: Any) -> None:
        # Prepare agent step message for streaming
        self.agent_name = kwargs.get("name", "Agent")
        self.stack = Stack[Step]()

        if self.stream_final_answer:
            self.final_stream = Message(
                author=self.stream_final_answer_agent_name, content=""
            )
            self.last_tokens: List[str] = []
            self.answer_reached = False

        run_step = Step(name=self.agent_name, type="run")
        run_step.start = utc_now()
        run_step.input = kwargs

        run_sync(run_step.send())

        self.stack.push(run_step)

    def on_agent_finish(self, agent_step: AgentStep, **kwargs: Any) -> None:
        if self.last_step:
            run_step = self.last_step
            run_step.end = utc_now()
            run_step.output = agent_step.prompt_node_response
            run_sync(run_step.update())

    # This method is called when a step has finished
    def on_agent_step(self, agent_step: AgentStep, **kwargs: Any) -> None:
        # Send previous agent step message
        self.last_step = self.stack.pop()

        # If token streaming is disabled
        if self.last_step.output == "":
            self.last_step.output = agent_step.prompt_node_response
        self.last_step.end = utc_now()
        run_sync(self.last_step.update())

        if not agent_step.is_last():
            # Prepare step for next agent step
            step = Step(name=self.agent_name, parent_id=self.last_step.id)
            self.stack.push(step)

    def on_new_token(self, token, **kwargs: Any) -> None:
        # Stream agent step tokens
        if self.stream_final_answer:
            if self.answer_reached:
                run_sync(self.final_stream.stream_token(token))
            else:
                self.last_tokens.append(token)

                last_tokens_concat = "".join(self.last_tokens)
                final_answer_match = re.search(
                    self.final_answer_pattern, last_tokens_concat
                )

                if final_answer_match:
                    self.answer_reached = True
                    run_sync(
                        self.final_stream.stream_token(final_answer_match.group(1))
                    )

        run_sync(self.stack.peek().stream_token(token))

    def on_tool_start(self, tool_input: str, tool: Tool, **kwargs: Any) -> None:
        # Tool started, create step
        parent_id = self.stack.items[0].id if self.stack.items[0] else None
        tool_step = Step(name=tool.name, type="tool", parent_id=parent_id)
        tool_step.input = tool_input
        tool_step.start = utc_now()
        self.stack.push(tool_step)

    def on_tool_finish(
        self,
        tool_result: str,
        tool_name: Optional[str] = None,
        tool_input: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        # Tool finished, send step with tool_result
        tool_step = self.stack.pop()
        tool_step.output = tool_result
        tool_step.end = utc_now()
        run_sync(tool_step.update())

    def on_tool_error(self, exception: Exception, tool: Tool, **kwargs: Any) -> None:
        # Tool error, send error message
        error_step = self.stack.pop()
        error_step.is_error = True
        error_step.output = str(exception)
        error_step.end = utc_now()
        run_sync(error_step.update())
