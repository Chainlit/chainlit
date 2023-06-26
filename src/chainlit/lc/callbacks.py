from typing import Any, Dict, List, Optional, Union
from langchain.callbacks.base import BaseCallbackHandler, AsyncCallbackHandler
from langchain.schema import (
    AgentAction,
    AgentFinish,
    BaseMessage,
    LLMResult,
)
from chainlit.emitter import ChainlitEmitter
from chainlit.context import get_emitter
from chainlit.message import Message, ErrorMessage
from chainlit.config import config
from chainlit.types import LLMSettings
from chainlit.sync import run_sync

IGNORE_LIST = ["AgentExecutor"]


def get_llm_settings(invocation_params: Union[Dict, None]):
    if invocation_params is None:
        return None
    elif invocation_params["_type"] == "openai":
        return LLMSettings(
            model_name=invocation_params["model_name"],
            stop=invocation_params["stop"],
            temperature=invocation_params["temperature"],
            max_tokens=invocation_params["max_tokens"],
            top_p=invocation_params["top_p"],
            frequency_penalty=invocation_params["frequency_penalty"],
            presence_penalty=invocation_params["presence_penalty"],
        )
    elif invocation_params["_type"] == "openai-chat":
        return LLMSettings(
            model_name=invocation_params["model_name"],
            stop=invocation_params["stop"],
        )
    else:
        return None


class BaseLangchainCallbackHandler(BaseCallbackHandler):
    emitter: ChainlitEmitter
    # Keep track of the formatted prompts to display them in the prompt playground.
    prompts: List[str]
    # Keep track of the LLM settings for the last prompt
    llm_settings: LLMSettings
    # Keep track of the call sequence, like [AgentExecutor, LLMMathChain, Calculator, ...]
    sequence: List[str]
    # Keep track of the last prompt for each session
    last_prompt: Union[str, None]
    # Keep track of the currently streamed message for the session
    stream: Union[Message, None]

    raise_error = True

    # We want to handler to be called on every message
    always_verbose: bool = True

    def __init__(self) -> None:
        self.emitter = get_emitter()
        self.prompts = []
        self.llm_settings = None
        self.sequence = []
        self.last_prompt = None
        self.stream = None

    def end_stream(self):
        self.stream = None

    def add_in_sequence(self, name: str):
        self.sequence.append(name)

    def pop_sequence(self):
        if self.sequence:
            return self.sequence.pop()

    def add_prompt(self, prompt: str, llm_settings: LLMSettings = None):
        self.prompts.append(prompt)
        self.llm_settings = llm_settings

    def pop_prompt(self):
        if self.prompts:
            self.last_prompt = self.prompts.pop()

    def consume_last_prompt(self):
        last_prompt = self.last_prompt
        self.last_prompt = None
        return last_prompt

    def get_message_params(self):
        llm_settings = self.llm_settings

        indent = len(self.sequence) if self.sequence else 0

        if self.sequence:
            author = self.sequence[-1]
        else:
            author = config.ui.name

        return author, indent, llm_settings


class LangchainCallbackHandler(BaseLangchainCallbackHandler, BaseCallbackHandler):
    def start_stream(self):
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.code.lc_rename:
            author = run_sync(config.code.lc_rename(author))

        self.pop_prompt()

        streamed_message = Message(
            author=author,
            indent=indent,
            llm_settings=llm_settings,
            prompt=self.consume_last_prompt(),
            content="",
        )
        self.stream = streamed_message

    def send_token(self, token: str):
        if self.stream:
            run_sync(self.stream.stream_token(token))

    def add_message(self, message, prompt: str = None, error=False):
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.code.lc_rename:
            author = run_sync(config.code.lc_rename(author))

        if error:
            run_sync(ErrorMessage(author=author, content=message).send())
            self.end_stream()
            return

        if self.stream:
            run_sync(self.stream.send())
            self.end_stream()
        else:
            run_sync(
                Message(
                    author=author,
                    content=message,
                    indent=indent,
                    prompt=prompt,
                    llm_settings=llm_settings,
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
        if not self.stream:
            self.start_stream()
        self.send_token(token)

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        self.pop_prompt()
        if response.llm_output is not None:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    run_sync(
                        self.emitter.update_token_count(token_usage["total_tokens"])
                    )

    def on_llm_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        pass

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        self.add_in_sequence(serialized["id"][-1])
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
        if isinstance(error, InterruptedError):
            return
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
        if isinstance(error, InterruptedError):
            return
        self.add_message(str(error), error=True)
        self.pop_sequence()

    def on_text(self, text: str, **kwargs: Any) -> None:
        pass

    def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        pass

    def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        pass


class AsyncLangchainCallbackHandler(BaseLangchainCallbackHandler, AsyncCallbackHandler):
    async def start_stream(self):
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.code.lc_rename:
            author = await config.code.lc_rename(author)

        self.pop_prompt()

        streamed_message = Message(
            author=author,
            indent=indent,
            prompt=self.consume_last_prompt(),
            llm_settings=llm_settings,
            content="",
        )
        self.stream = streamed_message

    async def send_token(self, token: str):
        if self.stream:
            await self.stream.stream_token(token)

    async def add_message(self, message, prompt: str = None, error=False):
        author, indent, llm_settings = self.get_message_params()

        if author in IGNORE_LIST:
            return

        if config.code.lc_rename:
            author = await config.code.lc_rename(author)

        if error:
            await ErrorMessage(author=author, content=message).send()
            self.end_stream()
            return

        if self.stream:
            await self.stream.send()
            self.end_stream()
        else:
            await Message(
                author=author,
                content=message,
                indent=indent,
                prompt=prompt,
                llm_settings=llm_settings,
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
        if not self.stream:
            await self.start_stream()
        await self.send_token(token)

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        self.pop_prompt()
        if response.llm_output is not None:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    await self.emitter.update_token_count(token_usage["total_tokens"])

    async def on_llm_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        pass

    async def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        self.add_in_sequence(serialized["id"][-1])
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
        if isinstance(error, InterruptedError):
            return
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
        if isinstance(error, InterruptedError):
            return
        await self.add_message(str(error), error=True)
        self.pop_sequence()

    async def on_text(self, text: str, **kwargs: Any) -> None:
        pass

    async def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        pass

    async def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        pass
