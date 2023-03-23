from __future__ import annotations
from typing import Any, Dict, List, Optional, Union, TYPE_CHECKING
if TYPE_CHECKING:
    from chainlit import Chainlit
import inspect
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import AgentAction, AgentFinish, LLMResult

NALLOWLIST = ['on_chain_start', 'on_chain_end']


class UiCallbackHandler(BaseCallbackHandler):

    sdk: Chainlit
    always_verbose: bool = True

    def __init__(self, sdk) -> None:
        self.memory = {}
        self.queue = []
        self.prompts = []
        self.llm_settings = None
        self.sdk = sdk
        self.tool_sequence = []
        self.all_sequence = []
        self.prev_indent = 0

    def reset_memory(self) -> None:
        self.memory = {}
        self.prompts = []
        self.llm_settings = None
        self.queue = []
        self.tool_sequence = []
        self.all_sequence = []
        self.prev_indent = 0

    def add_in_sequence(self, name: str, is_tool=False):
        self.all_sequence.append(name)
        if is_tool:
            if self.tool_sequence and self.tool_sequence[-1] == name:
                return
            self.tool_sequence.append(name)

    def pop_sequence(self, is_tool=False):
        if self.all_sequence:
            self.all_sequence.pop()
        if is_tool:
            if self.tool_sequence:
                self.tool_sequence.pop()

    def add_message(self, message, prompt: str = None, error=False):
        llm_settings = self.llm_settings if prompt else None
        bot_name = self.tool_sequence[-1] if self.tool_sequence else self.all_sequence[-1] if self.all_sequence else "Default"
        indent = len(self.tool_sequence) + 1

        self.sdk.send_message(
            author=bot_name,
            content=message,
            indent=indent,
            is_error=error,
            prompt=prompt,
            llm_settings=llm_settings
        )

    def process(self, event_action):
        event, action = event_action["func_name"].rsplit("_", 1)

        if action in ["start", "action"]:
            item = event_action
            item.update({
                "calls": [],
            })
            if not self.queue:
                self.queue.append(item)
            else:
                self.queue[-1]["calls"].append(item)
                self.queue.append(item)
        elif action in ["end", "finish"]:
            if len(self.queue) == 1:
                self.memory = self.queue.pop()
            elif len(self.queue):
                ended = self.queue.pop()
                ended.update(event_action)

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update(serialized)
        template.update({'prompts': prompts})
        template.update(kwargs)
        self.process(template)
        self.prompts += prompts
        self.llm_settings = kwargs['llm_settings']

    def on_llm_cache(
            self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ):
        self.prompts += prompts
        self.llm_settings = kwargs['llm_settings']

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Do nothing."""
        pass

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Do nothing."""
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update({'response': response})
        template.update(kwargs)
        self.process(template)

    def on_llm_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update({'error': error})
        template.update(kwargs)
        self.process(template)

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update(serialized)
        template.update(inputs)
        template.update(kwargs)
        self.process(template)
        self.add_in_sequence(serialized["name"])

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update(outputs)
        template.update(kwargs)
        self.process(template)
        output_key = list(outputs.keys())[0]
        if output_key:
            prompts = self.prompts.pop() if self.prompts else None
            self.add_message(outputs[output_key], prompts)
        self.pop_sequence()

    def on_chain_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update({'error': error})
        template.update(kwargs)
        self.process(template)
        self.add_message(str(error), error=True)
        self.pop_sequence()

    def on_tool_start(
        self, serialized: Dict[str, Any], inputs: Any, **kwargs: Any
    ) -> None:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update(serialized)
        template.update({'action': inputs})
        template.update(kwargs)
        self.process(template)
        self.add_in_sequence(serialized["name"], is_tool=True)
        # self.add_message(inputs["input"], False)

    def on_tool_end(
        self,
        output: str,
        observation_prefix: Optional[str] = None,
        llm_prefix: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update({'observation_prefix': observation_prefix})
        template.update({'llm_prefix': llm_prefix})
        template.update({'output': output})
        template.update(kwargs)
        # prompts = self.prompts.pop() if self.prompts else None
        # self.add_message(output)
        self.process(template)
        self.pop_sequence(is_tool=True)

    def on_tool_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Do nothing."""
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update({'error': error})
        template.update(kwargs)
        self.process(template)
        self.add_message(str(error), error=True)
        self.pop_sequence(is_tool=True)

    def on_text(self, text: str, **kwargs: Any) -> None:
        pass
        # if 'is_relevant' in kwargs and kwargs['is_relevant']:
        #     self.add_message(f"Information: {text}")

    def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        func_name = inspect.stack()[0][3]
        template = {'func_name': func_name}
        template.update({'action': action})
        template.update(kwargs)
        # prompts = self.prompts.pop() if self.prompts else None
        # self.add_message(action.log, prompts=prompts)
        # self.add_tool_in_sequence(action.tool)

    def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        # func_name = inspect.stack()[0][3]
        # template = {'func_name': func_name}
        # template.update({'finish': finish})
        # template.update(kwargs)
        # if self.tool_sequence:
        #     self.tool_sequence.pop()
        # prompts = self.prompts.pop() if self.prompts else None
        # self.add_message(f"{finish.log}", prompts=prompts)
