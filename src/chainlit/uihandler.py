from typing import Any, Dict, List, Optional, Union
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import AgentAction, AgentFinish, LLMResult
from chainlit.sdk import get_sdk
from chainlit.config import config
from chainlit.types import LLMSettings


class UiCallbackHandler(BaseCallbackHandler):

    prompts_per_session: Dict[str, List[str]]
    llm_settings_per_session: Dict[str, LLMSettings]
    tool_sequence_per_session: Dict[str, List[str]]
    sequence_per_session: Dict[str, List[str]]
    last_prompt_per_session: Dict[str, Union[str, None]]

    always_verbose: bool = True

    def __init__(self) -> None:
        self.prompts_per_session = {}
        self.llm_settings_per_session = {}
        self.tool_sequence_per_session = {}
        self.sequence_per_session = {}
        self.last_prompt_per_session = {}

    def add_in_sequence(self, name: str, is_tool=False):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return

        session_id = sdk.session["id"]

        if session_id not in self.sequence_per_session:
            self.sequence_per_session[session_id] = []

        if session_id not in self.tool_sequence_per_session:
            self.tool_sequence_per_session[session_id] = []

        sequence = self.sequence_per_session[session_id]
        tool_sequence = self.tool_sequence_per_session[session_id]

        sequence.append(name)
        if is_tool:
            if tool_sequence and tool_sequence[-1] == name:
                return
            tool_sequence.append(name)

    def pop_sequence(self, is_tool=False):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return

        session_id = sdk.session["id"]

        if session_id in self.sequence_per_session and self.sequence_per_session[session_id]:
            self.sequence_per_session[session_id].pop()

        if is_tool:
            if session_id in self.tool_sequence_per_session and self.tool_sequence_per_session[session_id]:
                self.tool_sequence_per_session[session_id].pop()

    def add_prompt(self, prompt: str, llm_settings: LLMSettings = None):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return

        session_id = sdk.session["id"]

        if session_id not in self.prompts_per_session:
            self.prompts_per_session[session_id] = []

        self.prompts_per_session[session_id].append(prompt)

        if llm_settings:
            self.llm_settings_per_session[session_id] = llm_settings

    def pop_prompt(self):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return

        session_id = sdk.session["id"]

        if session_id in self.prompts_per_session and self.prompts_per_session[session_id]:
            self.last_prompt_per_session[session_id] = self.prompts_per_session[session_id].pop(
            )

    def get_last_prompt(self):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return

        session_id = sdk.session["id"]

        last_prompt = self.last_prompt_per_session[session_id] if session_id in self.last_prompt_per_session else None
        return last_prompt

    def add_message(self, message, prompt: str = None, error=False):
        sdk = get_sdk()
        if not sdk or not sdk.session:
            return

        llm_settings = self.llm_settings_per_session.get(
            sdk.session["id"]) if prompt else None

        tool_sequence = self.tool_sequence_per_session.get(sdk.session["id"])
        all_sequence = self.sequence_per_session.get(sdk.session["id"])

        if tool_sequence:
            author = tool_sequence[-1]
            indent = len(tool_sequence) + 1
        elif all_sequence:
            author = all_sequence[-1]
            indent = 0
        else:
            author = config.chatbot_name
            indent = 0

        sdk.send_message(
            author=author,
            content=message,
            indent=indent,
            is_error=error,
            prompt=prompt,
            llm_settings=llm_settings
        )

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        self.add_prompt(prompts[0], kwargs.get('llm_settings'))

    def on_llm_cache(
            self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ):
        self.add_prompt(prompts[0], kwargs.get('llm_settings'))

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Do nothing."""
        pass

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Do nothing."""
        self.pop_prompt()

    def on_llm_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        pass

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        self.add_in_sequence(serialized["name"])

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        output_key = list(outputs.keys())[0]
        if output_key:
            prompt = self.get_last_prompt()
            self.add_message(outputs[output_key], prompt)
        self.pop_sequence()

    def on_chain_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        self.add_message(str(error), error=True)
        self.pop_sequence()

    def on_tool_start(
        self, serialized: Dict[str, Any], inputs: Any, **kwargs: Any
    ) -> None:
        self.add_in_sequence(serialized["name"], is_tool=True)
        # self.add_message(inputs["input"], False)

    def on_tool_end(
        self,
        output: str,
        observation_prefix: Optional[str] = None,
        llm_prefix: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        # prompts = self.prompts.pop() if self.prompts else None
        # self.add_message(output)
        self.pop_sequence(is_tool=True)

    def on_tool_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Do nothing."""
        self.add_message(str(error), error=True)
        self.pop_sequence(is_tool=True)

    def on_text(self, text: str, **kwargs: Any) -> None:
        pass
        # if 'is_relevant' in kwargs and kwargs['is_relevant']:
        #     self.add_message(f"Information: {text}")

    def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        pass
        # prompts = self.prompts.pop() if self.prompts else None
        # self.add_message(action.log, prompts=prompts)
        # self.add_tool_in_sequence(action.tool)

    def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        pass
        # prompts = self.prompts.pop() if self.prompts else None
        # self.add_message(f"{finish.log}", prompts=prompts)
