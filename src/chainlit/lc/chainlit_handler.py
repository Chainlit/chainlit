from typing import Any, Dict, List, Optional, Union
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import AgentAction, AgentFinish, LLMResult
from chainlit.sdk import get_sdk, Chainlit
from chainlit.config import config
from chainlit.types import LLMSettings

IGNORE_LIST = ["AgentExecutor"]


class ChainlitCallbackHandler(BaseCallbackHandler):
    # Keep track of the formatted prompts to display them in the prompt playground.
    prompts_per_session: Dict[str, List[str]]
    # Keep track of the LLM settings for the last prompt
    llm_settings_per_session: Dict[str, LLMSettings]
    # Keep track of the call sequence, like [AgentExecutor, LLMMathChain, Calculator, ...]
    sequence_per_session: Dict[str, List[str]]
    # Keep track of the last prompt for each session
    last_prompt_per_session: Dict[str, Union[str, None]]
    # Keep track of whether the session is streaming or not
    stream_per_session: Dict[str, bool]

    # We want to handler to be called on every message
    always_verbose: bool = True

    def __init__(self) -> None:
        # Initialize dictionaries to store session data
        self.prompts_per_session = {}
        self.llm_settings_per_session = {}
        self.sequence_per_session = {}
        self.last_prompt_per_session = {}
        self.stream_per_session = {}

    def is_streaming(self) -> bool:
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]
        return self.stream_per_session.get(session_id, False)

    def start_stream(self):
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]
        author, indent, llm_settings = self.get_message_params(sdk)

        if author in IGNORE_LIST:
            return

        sdk.stream_start(author=author, indent=indent, llm_settings=llm_settings)
        self.stream_per_session[session_id] = True

    def send_token(self, token: str):
        sdk = get_sdk()
        if not sdk:
            return

        sdk.send_token(token)

    def end_stream(self):
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]
        self.stream_per_session[session_id] = False

    def add_in_sequence(self, name: str):
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]

        # Initialize session sequences if not already present
        if session_id not in self.sequence_per_session:
            self.sequence_per_session[session_id] = []

        sequence = self.sequence_per_session[session_id]

        sequence.append(name)

    def pop_sequence(self):
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]

        # Remove the last element from the sequences
        if (
            session_id in self.sequence_per_session
            and self.sequence_per_session[session_id]
        ):
            self.sequence_per_session[session_id].pop()

    def add_prompt(self, prompt: str, llm_settings: LLMSettings = None):
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]

        # Initialize session prompts if not already present
        if session_id not in self.prompts_per_session:
            self.prompts_per_session[session_id] = []

        self.prompts_per_session[session_id].append(prompt)

        if llm_settings:
            self.llm_settings_per_session[session_id] = llm_settings

    def pop_prompt(self):
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]

        # Remove the last prompt from the session
        if (
            session_id in self.prompts_per_session
            and self.prompts_per_session[session_id]
        ):
            self.last_prompt_per_session[session_id] = self.prompts_per_session[
                session_id
            ].pop()

    def consume_last_prompt(self):
        sdk = get_sdk()
        if not sdk:
            return

        session_id = sdk.session["id"]

        last_prompt = self.last_prompt_per_session.get(session_id)
        self.last_prompt_per_session[session_id] = None
        return last_prompt

    def get_message_params(self, sdk: Chainlit):
        llm_settings = self.llm_settings_per_session.get(sdk.session["id"])

        sequence = self.sequence_per_session.get(sdk.session["id"])

        indent = len(sequence) if sequence else 0

        if sequence:
            if config.lc_rename:
                author = config.lc_rename(sequence[-1])
            else:
                author = sequence[-1]
        else:
            author = config.chatbot_name

        return author, indent, llm_settings

    def add_message(self, message, prompt: str = None, error=False):
        sdk = get_sdk()
        if not sdk:
            return

        author, indent, llm_settings = self.get_message_params(sdk)

        if author in IGNORE_LIST:
            return

        is_streaming = self.is_streaming()
        if is_streaming:
            self.end_stream()

        sdk.send_message(
            author=author,
            content=message,
            indent=indent,
            is_error=error,
            prompt=prompt,
            llm_settings=llm_settings,
            end_stream=is_streaming,
        )

    # Callbacks for various events

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        self.add_prompt(prompts[0], kwargs.get("llm_settings"))

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Do nothing."""
        if not self.is_streaming():
            self.start_stream()

        self.send_token(token)

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Do nothing."""
        self.pop_prompt()
        sdk = get_sdk()
        if not sdk:
            return
        if response.llm_output is not None:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    sdk.update_token_count(token_usage["total_tokens"])

    def on_llm_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        pass

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        self.add_in_sequence(serialized["name"])
        # Useful to display details button in the UI
        self.add_message("")

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        output_key = list(outputs.keys())[0]
        if output_key:
            prompt = self.consume_last_prompt()
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
        self.add_in_sequence(serialized["name"])
        self.add_message("")

    def on_tool_end(
        self,
        output: str,
        observation_prefix: Optional[str] = None,
        llm_prefix: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        prompt = self.consume_last_prompt()
        self.add_message(output, prompt)
        self.pop_sequence()

    def on_tool_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Do nothing."""
        self.add_message(str(error), error=True)
        self.pop_sequence()

    def on_text(self, text: str, **kwargs: Any) -> None:
        pass

    def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        pass

    def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        pass
