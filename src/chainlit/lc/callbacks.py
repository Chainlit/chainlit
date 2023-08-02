from typing import Any, Dict, List, Optional, Union

from langchain.callbacks.base import AsyncCallbackHandler, BaseCallbackHandler
from langchain.schema import AgentAction, AgentFinish, BaseMessage, LLMResult

from chainlit.config import config
from chainlit.context import get_emitter
from chainlit.emitter import ChainlitEmitter
from chainlit.message import ErrorMessage, Message
from chainlit.sync import run_sync
from chainlit.types import Prompt, PromptMessage

IGNORE_LIST = ["AgentExecutor"]
DEFAULT_ANSWER_PREFIX_TOKENS = ["Final", "Answer", ":"]


def get_llm_settings(invocation_params: Union[Dict, None]):
    if invocation_params is None:
        return None, None

    provider = invocation_params.pop("_type")
    return provider, invocation_params


def build_prompt(serialized: Dict[str, Any], inputs: Dict[str, Any]):
    inputs = {k: str(v) for (k, v) in inputs.items()}
    prompt_params = serialized.get("kwargs", {}).get("prompt", {}).get("kwargs", {})

    _messages = prompt_params.get("messages")

    if _messages:
        messages = []
        for m in _messages:
            m_prompt_params = m.get("kwargs", {}).get("prompt", {}).get("kwargs", {})
            m_template = m_prompt_params.get("template")
            m_template_format = m_prompt_params.get("template_format")
            messages += [
                PromptMessage(template=m_template, template_format=m_template_format)
            ]
    else:
        messages = None

    template = prompt_params.get("template")
    template_format = prompt_params.get("template_format")

    if template:
        return Prompt(
            template=template,
            template_format=template_format,
            inputs=inputs,
        )
    elif messages:
        return Prompt(inputs=inputs, messages=messages)


def convert_role(role: str):
    if role == "human" or role == "chat":
        return "user"
    elif role == "system":
        return "system"
    elif role == "ai":
        return "assistant"
    elif role == "function":
        return "function"
    else:
        raise ValueError(f"Unsupported role {role}")


class BaseLangchainCallbackHandler(BaseCallbackHandler):
    emitter: ChainlitEmitter
    # Keep track of the prompt to display them in the prompt playground.
    current_prompt: Optional[Prompt]
    # Keep track of the call sequence, like [AgentExecutor, LLMMathChain, Calculator, ...]
    sequence: List[Message]
    # Keep track of the currently streamed message for the session
    stream: Union[Message, None]
    # The stream we can use to stream the final answer from a chain
    final_stream: Union[Message, None]
    # Message at the root of the chat we should attach child messages to
    root_message: Message
    # Should we stream the final answer?
    stream_final_answer: bool = False
    # Token sequence that prefixes the answer
    answer_prefix_tokens: List[str]
    # Ignore white spaces and new lines when comparing answer_prefix_tokens to last tokens? (to determine if answer has been reached)
    strip_tokens: bool
    # Should answer prefix itself also be streamed?
    stream_prefix: bool

    raise_error = True

    # We want to handler to be called on every message
    always_verbose: bool = True

    def __init__(
        self,
        *,
        answer_prefix_tokens: Optional[List[str]] = None,
        strip_tokens: bool = True,
        stream_prefix: bool = False,
        stream_final_answer: bool = False,
        root_message: Optional[Message] = None,
    ) -> None:
        self.emitter = get_emitter()
        self.current_prompt = None
        self.sequence = []
        self.stream = None

        if root_message:
            self.root_message = root_message
        elif root_message := self.emitter.session.root_message:
            self.root_message = root_message
        else:
            self.root_message = Message(author=config.ui.name, content="")
            run_sync(self.root_message.send())

        # Langchain final answer streaming logic
        if answer_prefix_tokens is None:
            self.answer_prefix_tokens = DEFAULT_ANSWER_PREFIX_TOKENS
        else:
            self.answer_prefix_tokens = answer_prefix_tokens
        if strip_tokens:
            self.answer_prefix_tokens_stripped = [
                token.strip() for token in self.answer_prefix_tokens
            ]
        else:
            self.answer_prefix_tokens_stripped = self.answer_prefix_tokens
        self.last_tokens = [""] * len(self.answer_prefix_tokens)
        self.last_tokens_stripped = [""] * len(self.answer_prefix_tokens)
        self.strip_tokens = strip_tokens
        self.stream_prefix = stream_prefix
        self.answer_reached = False

        # Our own final answer streaming logic
        self.stream_final_answer = stream_final_answer
        self.final_stream = None
        self.has_streamed_final_answer = False

    def append_to_last_tokens(self, token: str) -> None:
        self.last_tokens.append(token)
        self.last_tokens_stripped.append(token.strip())
        if len(self.last_tokens) > len(self.answer_prefix_tokens):
            self.last_tokens.pop(0)
            self.last_tokens_stripped.pop(0)

    def check_if_answer_reached(self) -> bool:
        if self.strip_tokens:
            return self.last_tokens_stripped == self.answer_prefix_tokens_stripped
        else:
            return self.last_tokens == self.answer_prefix_tokens

    def start_stream(self):
        author = self.get_author()
        if author in IGNORE_LIST:
            return

        parent_id = self.get_last_message().parent_id

        self.stream = self.create_message(
            prompt=self.current_prompt, author=author, parent_id=parent_id
        )

    def end_stream(self):
        self.stream = None

    def add_in_sequence(self, message: Message):
        self.sequence.append(message)

    def pop_sequence(self):
        if self.sequence:
            return self.sequence.pop()

    def get_author(self):
        if self.sequence:
            return self.sequence[-1].author
        return config.ui.name

    def get_last_message(self):
        for message in reversed(self.sequence):
            if message.author not in IGNORE_LIST:
                return message
        return self.root_message

    def create_error(self, error: Exception):
        if isinstance(error, InterruptedError):
            return None

        return ErrorMessage(
            content=str(error), author=self.get_author(), prompt=self.current_prompt
        )

    def create_message(
        self,
        content: str = "",
        prompt: Optional[Prompt] = None,
        author: Optional[str] = None,
        parent_id: Optional[str] = None,
    ):
        if parent_id is None:
            last_message = self.get_last_message()
            parent_id = last_message.id

        return Message(
            content,
            author=author or self.get_author(),
            prompt=prompt,
            parent_id=parent_id,
        )


def _on_chat_model_start(
    self: BaseLangchainCallbackHandler,
    serialized: Dict[str, Any],
    messages: List[List[BaseMessage]],
    **kwargs: Any,
):
    invocation_params = kwargs.get("invocation_params")
    provider, settings = get_llm_settings(invocation_params)

    if self.current_prompt:
        self.current_prompt.provider = provider
        self.current_prompt.settings = settings
        if self.current_prompt.messages:
            for idx, m in enumerate(messages[0]):
                self.current_prompt.messages[idx].formatted = m.content
                self.current_prompt.messages[idx].role = convert_role(m.type)

        elif self.current_prompt.template:
            formatted_prompt = "\n".join([m.content for m in messages[0]])
            self.current_prompt.formatted = formatted_prompt
    else:
        prompt_messages = [
            PromptMessage(formatted=m.content, role=convert_role(m.type))
            for m in messages[0]
        ]
        self.current_prompt = Prompt(
            messages=prompt_messages,
            provider=provider,
            settings=settings,
        )


def _on_llm_start(
    self: BaseLangchainCallbackHandler,
    serialized: Dict[str, Any],
    prompts: List[str],
    **kwargs: Any,
) -> None:
    invocation_params = kwargs.get("invocation_params")
    provider, settings = get_llm_settings(invocation_params)

    if self.current_prompt:
        self.current_prompt.formatted = prompts[0]
        self.current_prompt.provider = provider
        self.current_prompt.settings = settings
    else:
        self.current_prompt = Prompt(
            formatted=prompts[0],
            provider=provider,
            settings=settings,
        )


class LangchainCallbackHandler(BaseLangchainCallbackHandler, BaseCallbackHandler):
    def on_error(self, error, **_):
        if error := self.create_error(error):
            run_sync(error.send())
            self.pop_sequence()

    on_tool_error = on_error
    on_llm_error = on_error
    on_chain_error = on_error

    def send_token(self, token: str, final: bool = False):
        stream = self.final_stream if final else self.stream
        if stream:
            run_sync(stream.stream_token(token))
            self.has_streamed_final_answer = final

    def add_message(self, message: Message):
        if message.author in IGNORE_LIST:
            return

        if self.stream:
            run_sync(self.stream.send())
            self.end_stream()

        else:
            run_sync(message.send())

    # Callbacks for various events

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        _on_llm_start(self, serialized, prompts, **kwargs)

    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        **kwargs: Any,
    ) -> None:
        _on_chat_model_start(self, serialized, messages, **kwargs)

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        if not self.stream:
            self.start_stream()
        self.send_token(token)

        if not self.stream_final_answer:
            return

        self.append_to_last_tokens(token)

        if self.answer_reached:
            if not self.final_stream:
                self.final_stream = Message(author=config.ui.name, content="")
            self.send_token(token, final=True)
        else:
            self.answer_reached = self.check_if_answer_reached()

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        if response.llm_output is not None:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    run_sync(
                        self.emitter.update_token_count(token_usage["total_tokens"])
                    )
        if self.current_prompt:
            self.current_prompt.completion = response.generations[0][0].text
        if self.final_stream:
            run_sync(self.final_stream.send())

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        self.current_prompt = build_prompt(serialized, inputs)

        message = self.create_message(
            author=serialized["id"][-1], prompt=self.current_prompt
        )
        self.add_in_sequence(message)
        self.add_message(message)

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        output_key = list(outputs.keys())[0]
        if output_key:
            parent_id = self.get_last_message().parent_id
            message = self.create_message(
                outputs[output_key], self.current_prompt, parent_id=parent_id
            )
            self.add_message(message)

        self.pop_sequence()
        self.current_prompt = None

    def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, **kwargs: Any
    ) -> None:
        message = self.create_message(author=serialized["name"])
        self.add_in_sequence(message)
        self.add_message(message)

    def on_tool_end(
        self,
        output: str,
        observation_prefix: Optional[str] = None,
        llm_prefix: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        parent_id = self.get_last_message().parent_id
        message = self.create_message(output, None, parent_id=parent_id)
        self.add_message(message)
        self.pop_sequence()

    def on_text(self, text: str, **kwargs: Any) -> None:
        pass

    def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        pass

    def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        pass


class AsyncLangchainCallbackHandler(BaseLangchainCallbackHandler, AsyncCallbackHandler):
    async def on_error(self, error, **_):
        if error := self.create_error(error):
            await error.send()
            self.pop_sequence()

    on_tool_error = on_error
    on_llm_error = on_error
    on_chain_error = on_error

    async def send_token(self, token: str, final: bool = False):
        stream = self.final_stream if final else self.stream
        if stream:
            await stream.stream_token(token)
            self.has_streamed_final_answer = final

    async def add_message(self, message: Message):
        if message.author in IGNORE_LIST:
            return

        if self.stream:
            await self.stream.send()
            self.end_stream()

        else:
            await message.send()

    # Callbacks for various events

    async def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        _on_llm_start(self, serialized, prompts, **kwargs)

    async def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        **kwargs: Any,
    ) -> None:
        _on_chat_model_start(self, serialized, messages, **kwargs)

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        if not self.stream:
            self.start_stream()
        await self.send_token(token)

        if not self.stream_final_answer:
            return

        self.append_to_last_tokens(token)

        if self.answer_reached:
            if not self.final_stream:
                self.final_stream = Message(author=config.ui.name, content="")
            await self.send_token(token, final=True)
        else:
            self.answer_reached = self.check_if_answer_reached()

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        if response.llm_output is not None:
            if "token_usage" in response.llm_output:
                token_usage = response.llm_output["token_usage"]
                if "total_tokens" in token_usage:
                    await self.emitter.update_token_count(token_usage["total_tokens"])
        if self.current_prompt:
            self.current_prompt.completion = response.generations[0][0].text
        if self.final_stream:
            run_sync(self.final_stream.send())
        if self.final_stream:
            await self.final_stream.send()

    async def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        self.current_prompt = build_prompt(serialized, inputs)

        message = self.create_message(
            author=serialized["id"][-1], prompt=self.current_prompt
        )
        self.add_in_sequence(message)
        await self.add_message(message)

    async def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        output_key = list(outputs.keys())[0]
        if output_key:
            parent_id = self.get_last_message().parent_id
            message = self.create_message(
                outputs[output_key], prompt=self.current_prompt, parent_id=parent_id
            )
            await self.add_message(message)
        self.pop_sequence()
        self.current_prompt = None

    async def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, **kwargs: Any
    ) -> None:
        message = self.create_message(author=serialized["name"])
        self.add_in_sequence(message)
        await self.add_message(message)

    async def on_tool_end(
        self,
        output: str,
        observation_prefix: Optional[str] = None,
        llm_prefix: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        parent_id = self.get_last_message().parent_id
        message = self.create_message(output, parent_id=parent_id)
        await self.add_message(message)
        self.pop_sequence()

    async def on_text(self, text: str, **kwargs: Any) -> None:
        pass

    async def on_agent_action(self, action: AgentAction, **kwargs: Any) -> Any:
        pass

    async def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""
        pass
