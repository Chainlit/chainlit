from typing import Any, Dict, List, Optional, Union
from langchain.callbacks.base import BaseCallbackHandler, AsyncCallbackHandler
from langchain.schema import (
    AgentAction,
    AgentFinish,
    BaseMessage,
    LLMResult,
)
from chainlit.sdk import get_sdk, Chainlit
from chainlit.message import Message, ErrorMessage
from chainlit.config import config
from chainlit.types import LLMSettings
from syncer import sync

IGNORE_LIST = ["AgentExecutor"]


def get_llm_settings(invocation_params: Union[Dict, None]):
    if invocation_params is None:
        return None
    if invocation_params["_type"] == "openai-":
        return LLMSettings(
            model_name=invocation_params["model_name"],
            stop=invocation_params["stop"],
            temperature=invocation_params["temperature"],
            max_tokens=invocation_params["max_tokens"],
            top_p=invocation_params["top_p"],
            frequency_penalty=invocation_params["frequency_penalty"],
            presence_penalty=invocation_params["presence_penalty"],
        )
    if invocation_params["_type"] == "openai-chat":
        return LLMSettings(
            model_name=invocation_params["model_name"],
            stop=invocation_params["stop"],
        )
    else:
        return None


class BaseChainlitCallbackHandler(BaseCallbackHandler):
    _sdk: Chainlit
    # Keep track of the formatted prompts to display them in the prompt playground.
    prompts_per_session: Dict[str, List[str]]
    # Keep track of the LLM settings for the last prompt
    llm_settings_per_session: Dict[str, LLMSettings]
    # Keep track of the call sequence, like [AgentExecutor, LLMMathChain, Calculator, ...]
    sequence_per_session: Dict[str, List[str]]
    # Keep track of the last prompt for each session
    last_prompt_per_session: Dict[str, Union[str, None]]
    # Keep track of the currently streamed message for the session
    stream_per_session: Dict[str, Message]

    # We want to handler to be called on every message
    always_verbose: bool = True

    def __init__(self) -> None:
        self._sdk = get_sdk()
        # Initialize dictionaries to store session data
        self.prompts_per_session = {}
        self.llm_settings_per_session = {}
        self.sequence_per_session = {}
        self.last_prompt_per_session = {}
        self.stream_per_session = {}

    @property
    def sdk(self):
        if not hasattr(self, "_sdk"):
            self._sdk = get_sdk()
            if not self._sdk:
                raise RuntimeError("Chainlit SDK not initialized")
        return self._sdk

    def get_streamed_message(self) -> Union[Message, None]:
        session_id = self.sdk.session["id"]
        return self.stream_per_session.get(session_id, None)

    def end_stream(self):
        session_id = self.sdk.session["id"]
        del self.stream_per_session[session_id]

    def add_in_sequence(self, name: str):
        session_id = self.sdk.session["id"]

        # Initialize session sequences if not already present
        if session_id not in self.sequence_per_session:
            self.sequence_per_session[session_id] = []

        sequence = self.sequence_per_session[session_id]

        sequence.append(name)

    def pop_sequence(self):
        session_id = self.sdk.session["id"]

        # Remove the last element from the sequences
        if (
            session_id in self.sequence_per_session
            and self.sequence_per_session[session_id]
        ):
            self.sequence_per_session[session_id].pop()

    def add_prompt(self, prompt: str, llm_settings: LLMSettings = None):
        session_id = self.sdk.session["id"]

        # Initialize session prompts if not already present
        if session_id not in self.prompts_per_session:
            self.prompts_per_session[session_id] = []

        self.prompts_per_session[session_id].append(prompt)

        if llm_settings:
            self.llm_settings_per_session[session_id] = llm_settings

    def pop_prompt(self):
        session_id = self.sdk.session["id"]

        # Remove the last prompt from the session
        if (
            session_id in self.prompts_per_session
            and self.prompts_per_session[session_id]
        ):
            self.last_prompt_per_session[session_id] = self.prompts_per_session[
                session_id
            ].pop()

    def consume_last_prompt(self):
        session_id = self.sdk.session["id"]

        last_prompt = self.last_prompt_per_session.get(session_id)
        self.last_prompt_per_session[session_id] = None
        return last_prompt

    def get_message_params(self):
        session_id = self.sdk.session["id"]
        llm_settings = self.llm_settings_per_session.get(session_id)

        sequence = self.sequence_per_session.get(session_id)

        indent = len(sequence) if sequence else 0

        if sequence:
            author = sequence[-1]
        else:
            author = config.chatbot_name

        return author, indent, llm_settings


class ChainlitCallbackHandler(BaseChainlitCallbackHandler, BaseCallbackHandler):
    def start_stream(self):
        session_id = self.sdk.session["id"]
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.lc_rename:
            author = sync(config.lc_rename(author))

        streamed_message = Message(
            author=author,
            indent=indent,
            llm_settings=llm_settings,
            content="",
            sdk=self.sdk,
        )
        self.stream_per_session[session_id] = streamed_message

    def send_token(self, token: str):
        streamed_message = self.get_streamed_message()
        if streamed_message:
            sync(streamed_message.stream_token(token))

    def add_message(self, message, prompt: str = None, error=False):
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.lc_rename:
            author = sync(config.lc_rename(author))

        if error:
            sync(ErrorMessage(author=author, content=message, sdk=self.sdk).send())
            self.end_stream()
            return

        streamed_message = self.get_streamed_message()

        if streamed_message:
            streamed_message.prompt = prompt
            streamed_message.llm_settings = llm_settings
            sync(streamed_message.send())
            self.end_stream()
        else:
            sync(
                Message(
                    author=author,
                    content=message,
                    indent=indent,
                    prompt=prompt,
                    llm_settings=llm_settings,
                    sdk=self.sdk,
                ).send()
            )

    # Callbacks for various events

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        invocation_params = kwargs.get("invocation_params")
        llm_settings = get_llm_settings(invocation_params)
        self.add_prompt(prompts[0], llm_settings)

    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        **kwargs: Any,
    ) -> None:
        invocation_params = kwargs.get("invocation_params")
        llm_settings = get_llm_settings(invocation_params)
        prompt = "\n".join([m.content for m in messages[0]])
        self.add_prompt(prompt, llm_settings)

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        if not self.get_streamed_message():
            self.start_stream()
        self.send_token(token)

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        self.pop_prompt()
        if response.llm_output is not None:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    sync(self.sdk.update_token_count(token_usage["total_tokens"]))

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


class AsyncChainlitCallbackHandler(BaseChainlitCallbackHandler, AsyncCallbackHandler):
    async def start_stream(self):
        session_id = self.sdk.session["id"]
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.lc_rename:
            author = await config.lc_rename(author)

        streamed_message = Message(
            author=author,
            indent=indent,
            llm_settings=llm_settings,
            content="",
            sdk=self.sdk,
        )
        self.stream_per_session[session_id] = streamed_message

    async def send_token(self, token: str):
        streamed_message = self.get_streamed_message()
        if streamed_message:
            await streamed_message.stream_token(token)

    async def add_message(self, message, prompt: str = None, error=False):
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.lc_rename:
            author = await config.lc_rename(author)

        if error:
            await ErrorMessage(author=author, content=message, sdk=self.sdk).send()
            self.end_stream()
            return

        streamed_message = self.get_streamed_message()

        if streamed_message:
            streamed_message.prompt = prompt
            streamed_message.llm_settings = llm_settings
            await streamed_message.send()
            self.end_stream()
        else:
            await Message(
                author=author,
                content=message,
                indent=indent,
                prompt=prompt,
                llm_settings=llm_settings,
                sdk=self.sdk,
            ).send()

    # Callbacks for various events

    async def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        invocation_params = kwargs.get("invocation_params")
        llm_settings = get_llm_settings(invocation_params)
        self.add_prompt(prompts[0], llm_settings)

    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        **kwargs: Any,
    ) -> None:
        invocation_params = kwargs.get("invocation_params")
        llm_settings = get_llm_settings(invocation_params)
        prompt = "\n".join([m.content for m in messages[0]])
        self.add_prompt(prompt, llm_settings)

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        if not self.get_streamed_message():
            await self.start_stream()
        await self.send_token(token)

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        self.pop_prompt()
        if response.llm_output is not None:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    await self.sdk.update_token_count(token_usage["total_tokens"])

    async def on_llm_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        pass

    async def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        self.add_in_sequence(serialized["name"])
        # Useful to display details button in the UI
        await self.add_message("")

    async def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        output_key = list(outputs.keys())[0]
        if output_key:
            prompt = self.consume_last_prompt()
            await self.add_message(outputs[output_key], prompt)
        self.pop_sequence()

    async def on_chain_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        await self.add_message(str(error), error=True)
        self.pop_sequence()

    async def on_tool_start(
        self, serialized: Dict[str, Any], inputs: Any, **kwargs: Any
    ) -> None:
        self.add_in_sequence(serialized["name"])
        await self.add_message("")

    async def on_tool_end(
        self,
        output: str,
        observation_prefix: Optional[str] = None,
        llm_prefix: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        prompt = self.consume_last_prompt()
        await self.add_message(output, prompt)
        self.pop_sequence()

    async def on_tool_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Do nothing."""
        await self.add_message(str(error), error=True)
        self.pop_sequence()

    async def on_text(self, text: str, **kwargs: Any) -> None:
        pass

    async def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        pass

    async def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        pass
