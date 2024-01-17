from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from chainlit.context import context_var
from chainlit.message import Message
from chainlit.playground.providers.openai import stringify_function_call
from chainlit.step import Step, TrueStepType
from langchain.callbacks.tracers.base import BaseTracer
from langchain.callbacks.tracers.schemas import Run
from langchain.schema import BaseMessage
from langchain.schema.output import ChatGenerationChunk, GenerationChunk
from literalai import ChatGeneration, CompletionGeneration, GenerationMessage

DEFAULT_ANSWER_PREFIX_TOKENS = ["Final", "Answer", ":"]


class FinalStreamHelper:
    # The stream we can use to stream the final answer from a chain
    final_stream: Union[Message, None]
    # Should we stream the final answer?
    stream_final_answer: bool = False
    # Token sequence that prefixes the answer
    answer_prefix_tokens: List[str]
    # Ignore white spaces and new lines when comparing answer_prefix_tokens to last tokens? (to determine if answer has been reached)
    strip_tokens: bool

    answer_reached: bool

    def __init__(
        self,
        answer_prefix_tokens: Optional[List[str]] = None,
        stream_final_answer: bool = False,
        force_stream_final_answer: bool = False,
        strip_tokens: bool = True,
    ) -> None:
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
        self.answer_reached = force_stream_final_answer

        # Our own final answer streaming logic
        self.stream_final_answer = stream_final_answer
        self.final_stream = None
        self.has_streamed_final_answer = False

    def _check_if_answer_reached(self) -> bool:
        if self.strip_tokens:
            return self._compare_last_tokens(self.last_tokens_stripped)
        else:
            return self._compare_last_tokens(self.last_tokens)

    def _compare_last_tokens(self, last_tokens: List[str]):
        if last_tokens == self.answer_prefix_tokens_stripped:
            # If tokens match perfectly we are done
            return True
        else:
            # Some LLMs will consider all the tokens of the final answer as one token
            # so we check if any last token contains all answer tokens
            return any(
                [
                    all(
                        answer_token in last_token
                        for answer_token in self.answer_prefix_tokens_stripped
                    )
                    for last_token in last_tokens
                ]
            )

    def _append_to_last_tokens(self, token: str) -> None:
        self.last_tokens.append(token)
        self.last_tokens_stripped.append(token.strip())
        if len(self.last_tokens) > len(self.answer_prefix_tokens):
            self.last_tokens.pop(0)
            self.last_tokens_stripped.pop(0)


class GenerationHelper:
    generation_sequence: List[Union[ChatGeneration, CompletionGeneration]]

    def __init__(self) -> None:
        self.generation_sequence = []

    @property
    def current_generation(self):
        return self.generation_sequence[-1] if self.generation_sequence else None

    def _convert_message_role(self, role: str):
        if "human" in role.lower():
            return "user"
        elif "system" in role.lower():
            return "system"
        elif "function" in role.lower():
            return "function"
        else:
            return "assistant"

    def _convert_message_dict(
        self,
        message: Dict,
        template: Optional[str] = None,
        template_format: str = "f-string",
    ):
        class_name = message["id"][-1]
        kwargs = message.get("kwargs", {})
        function_call = kwargs.get("additional_kwargs", {}).get("function_call")
        if function_call:
            content = stringify_function_call(function_call)
        else:
            content = kwargs.get("content", "")
        return GenerationMessage(
            name=kwargs.get("name"),
            role=self._convert_message_role(class_name),
            template=template,
            template_format=template_format,
            formatted=content,
        )

    def _convert_message(
        self,
        message: Union[Dict, BaseMessage],
        template: Optional[str] = None,
        template_format: str = "f-string",
    ):
        if isinstance(message, dict):
            return self._convert_message_dict(
                message,
            )
        function_call = message.additional_kwargs.get("function_call")
        if function_call:
            content = stringify_function_call(function_call)
        else:
            content = message.content
        return GenerationMessage(
            name=getattr(message, "name", None),
            role=self._convert_message_role(message.type),
            template=template,
            template_format=template_format,
            formatted=content,
        )

    def _get_messages(self, serialized: Dict):
        # In LCEL prompts messages are not at the same place
        lcel_messages = serialized.get("kwargs", {}).get(
            "messages", []
        )  # type: List[Dict]
        if lcel_messages:
            return lcel_messages
        else:
            # For chains
            prompt_params = (
                serialized.get("kwargs", {}).get("prompt", {}).get("kwargs", {})
            )
            chain_messages = prompt_params.get("messages", [])  # type: List[Dict]

            return chain_messages

    def _build_generation(self, serialized: Dict, inputs: Dict):
        messages = self._get_messages(serialized)
        if messages:
            # If prompt is chat, the formatted values will be added in on_chat_model_start
            self._build_chat_template_generation(messages, inputs)
        else:
            # For completion prompt everything is done here
            self._build_completion_generation(serialized, inputs)

    def _build_completion_generation(self, serialized: Dict, inputs: Dict):
        if not serialized:
            return
        kwargs = serialized.get("kwargs", {})
        template = kwargs.get("template")
        template_format = kwargs.get("template_format")
        stringified_inputs = {k: str(v) for (k, v) in inputs.items()}

        if not template:
            return

        self.generation_sequence.append(
            CompletionGeneration(
                template=template,
                template_format=template_format,
                inputs=stringified_inputs,
            )
        )

    def _build_default_generation(
        self,
        run: Run,
        generation_type: str,
        provider: str,
        llm_settings: Dict,
        completion: str,
    ):
        """Build a prompt once an LLM has been executed if no current prompt exists (without template)"""
        if "chat" in generation_type.lower():
            return ChatGeneration(
                provider=provider,
                settings=llm_settings,
                completion=completion,
                messages=[
                    GenerationMessage(
                        formatted=formatted_prompt,
                        role=self._convert_message_role(formatted_prompt.split(":")[0]),
                    )
                    for formatted_prompt in run.inputs.get("prompts", [])
                ],
            )
        else:
            return CompletionGeneration(
                provider=provider,
                settings=llm_settings,
                completion=completion,
                formatted=run.inputs.get("prompts", [])[0],
            )

    def _build_chat_template_generation(self, lc_messages: List[Dict], inputs: Dict):
        def build_template_messages() -> List[GenerationMessage]:
            template_messages = []  # type: List[GenerationMessage]

            if not lc_messages:
                return template_messages

            for lc_message in lc_messages:
                message_kwargs = lc_message.get("kwargs", {})
                class_name = lc_message["id"][-1]  # type: str
                prompt = message_kwargs.get("prompt", {})
                prompt_kwargs = prompt.get("kwargs", {})
                template = prompt_kwargs.get("template")
                template_format = prompt_kwargs.get("template_format")

                if "placeholder" in class_name.lower():
                    variable_name = lc_message.get(
                        "variable_name"
                    ) or message_kwargs.get(
                        "variable_name"
                    )  # type: Optional[str]
                    variable = inputs.get(variable_name, [])
                    placeholder_size = len(variable)

                    if placeholder_size:
                        template_messages += [
                            GenerationMessage(placeholder_size=placeholder_size)
                        ]
                else:
                    template_messages += [
                        GenerationMessage(
                            template=template,
                            role=self._convert_message_role(class_name),
                        )
                    ]
            return template_messages

        template_messages = build_template_messages()

        if not template_messages:
            return

        stringified_inputs = {k: str(v) for (k, v) in inputs.items()}
        self.generation_sequence.append(
            ChatGeneration(messages=template_messages, inputs=stringified_inputs)
        )

    def _build_chat_formatted_generation(
        self, lc_messages: Union[List[BaseMessage], List[dict]]
    ):
        if not self.current_generation:
            return

        formatted_messages = []  # type: List[GenerationMessage]
        if self.current_generation.messages:
            # This is needed to compute the correct message index to read
            placeholder_offset = 0
            # The final list of messages
            formatted_messages = []
            # Looping the messages built in build_prompt
            # They only contain the template
            for template_index, template_message in enumerate(
                self.current_generation.messages
            ):
                # If a message has a placeholder size, we need to replace it
                # With the N following messages, where N is the placeholder size
                if template_message.placeholder_size:
                    for _ in range(template_message.placeholder_size):
                        lc_message = lc_messages[template_index + placeholder_offset]
                        formatted_messages += [self._convert_message(lc_message)]
                        # Increment the placeholder offset
                        placeholder_offset += 1
                    # Finally, decrement the placeholder offset by one
                    # Because the message representing the placeholder is now consumed
                    placeholder_offset -= 1
                # The current message is not a placeholder
                else:
                    lc_message = lc_messages[template_index + placeholder_offset]
                    # Update the role and formatted value, keep the template
                    formatted_messages += [
                        self._convert_message(
                            lc_message,
                            template=template_message.template,
                            template_format=template_message.template_format,
                        )
                    ]
            # If the chat llm has more message than the initial chain prompt, append them
            # Typically happens with function agents
            if len(lc_messages) > len(formatted_messages):
                formatted_messages += [
                    self._convert_message(m)
                    for m in lc_messages[len(formatted_messages) :]
                ]
        else:
            formatted_messages = [
                self._convert_message(lc_message) for lc_message in lc_messages
            ]

        self.current_generation.messages = formatted_messages

    def _build_llm_settings(
        self,
        serialized: Dict,
        invocation_params: Optional[Dict] = None,
    ):
        # invocation_params = run.extra.get("invocation_params")
        if invocation_params is None:
            return None, None

        provider = invocation_params.pop("_type", "")  # type: str

        model_kwargs = invocation_params.pop("model_kwargs", {})

        if model_kwargs is None:
            model_kwargs = {}

        merged = {
            **invocation_params,
            **model_kwargs,
            **serialized.get("kwargs", {}),
        }

        # make sure there is no api key specification
        settings = {k: v for k, v in merged.items() if not k.endswith("_api_key")}

        return provider, settings


DEFAULT_TO_IGNORE = ["Runnable", "<lambda>"]
DEFAULT_TO_KEEP = ["retriever", "llm", "agent", "chain", "tool"]


class LangchainTracer(BaseTracer, GenerationHelper, FinalStreamHelper):
    steps: Dict[str, Step]
    parent_id_map: Dict[str, str]
    ignored_runs: set

    def __init__(
        self,
        # Token sequence that prefixes the answer
        answer_prefix_tokens: Optional[List[str]] = None,
        # Should we stream the final answer?
        stream_final_answer: bool = False,
        # Should force stream the first response?
        force_stream_final_answer: bool = False,
        # Runs to ignore to enhance readability
        to_ignore: Optional[List[str]] = None,
        # Runs to keep within ignored runs
        to_keep: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> None:
        BaseTracer.__init__(self, **kwargs)
        GenerationHelper.__init__(self)
        FinalStreamHelper.__init__(
            self,
            answer_prefix_tokens=answer_prefix_tokens,
            stream_final_answer=stream_final_answer,
            force_stream_final_answer=force_stream_final_answer,
        )
        self.context = context_var.get()
        self.steps = {}
        self.parent_id_map = {}
        self.ignored_runs = set()

        if self.context.current_step:
            self.root_parent_id = self.context.current_step.id
        elif self.context.session.root_message:
            self.root_parent_id = self.context.session.root_message.id
        else:
            self.root_parent_id = None

        if to_ignore is None:
            self.to_ignore = DEFAULT_TO_IGNORE
        else:
            self.to_ignore = to_ignore

        if to_keep is None:
            self.to_keep = DEFAULT_TO_KEEP
        else:
            self.to_keep = to_keep

    def _run_sync(self, co):
        context_var.set(self.context)
        self.context.loop.create_task(co)

    def _persist_run(self, run: Run) -> None:
        pass

    def _get_run_parent_id(self, run: Run):
        parent_id = str(run.parent_run_id) if run.parent_run_id else self.root_parent_id

        return parent_id

    def _get_non_ignored_parent_id(self, current_parent_id: Optional[str] = None):
        if not current_parent_id:
            return self.root_parent_id

        if current_parent_id not in self.parent_id_map:
            return None

        while current_parent_id in self.parent_id_map:
            # If the parent id is in the ignored runs, we need to get the parent id of the ignored run
            if current_parent_id in self.ignored_runs:
                current_parent_id = self.parent_id_map[current_parent_id]
            else:
                return current_parent_id

        return self.root_parent_id

    def _should_ignore_run(self, run: Run):
        parent_id = self._get_run_parent_id(run)

        if parent_id:
            # Add the parent id of the ignored run in the mapping
            # so we can re-attach a kept child to the right parent id
            self.parent_id_map[str(run.id)] = parent_id

        ignore_by_name = False
        ignore_by_parent = parent_id in self.ignored_runs

        for filter in self.to_ignore:
            if filter in run.name:
                ignore_by_name = True
                break

        ignore = ignore_by_name or ignore_by_parent

        # If the ignore cause is the parent being ignored, check if we should nonetheless keep the child
        if ignore_by_parent and not ignore_by_name and run.run_type in self.to_keep:
            return False, self._get_non_ignored_parent_id(parent_id)
        else:
            if ignore:
                # Tag the run as ignored
                self.ignored_runs.add(str(run.id))
            return ignore, parent_id

    def _is_annotable(self, run: Run):
        return run.run_type in ["retriever", "llm"]

    def _get_completion(self, generation: Dict):
        if message := generation.get("message"):
            kwargs = message.get("kwargs", {})
            if function_call := kwargs.get("additional_kwargs", {}).get(
                "function_call"
            ):
                return stringify_function_call(function_call), "json"
            else:
                return kwargs.get("content", ""), None
        else:
            return generation.get("text", ""), None

    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Adding formatted content and new message to the previously built template prompt"""
        lc_messages = messages[0]
        if not self.current_generation:
            self.generation_sequence.append(
                ChatGeneration(messages=[self._convert_message(m) for m in lc_messages])
            )
        else:
            self._build_chat_formatted_generation(lc_messages)

        super().on_chat_model_start(
            serialized,
            messages,
            run_id=run_id,
            parent_run_id=parent_run_id,
            tags=tags,
            metadata=metadata,
            **kwargs,
        )

    def on_llm_new_token(
        self,
        token: str,
        *,
        chunk: Optional[Union[GenerationChunk, ChatGenerationChunk]] = None,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> Any:
        msg = self.steps.get(str(run_id), None)
        if msg:
            self._run_sync(msg.stream_token(token))

        if self.stream_final_answer:
            self._append_to_last_tokens(token)

            if self.answer_reached:
                if not self.final_stream:
                    self.final_stream = Message(content="")
                    self._run_sync(self.final_stream.send())
                self._run_sync(self.final_stream.stream_token(token))
                self.has_streamed_final_answer = True
            else:
                self.answer_reached = self._check_if_answer_reached()

        BaseTracer.on_llm_new_token(
            self,
            token,
            chunk=chunk,
            run_id=run_id,
            parent_run_id=parent_run_id,
            **kwargs,
        )

    def _start_trace(self, run: Run) -> None:
        super()._start_trace(run)
        context_var.set(self.context)

        if run.run_type in ["chain", "prompt"]:
            # Prompt templates are contained in chains or prompts (lcel)
            self._build_generation(run.serialized or {}, run.inputs)

        ignore, parent_id = self._should_ignore_run(run)

        if ignore:
            return

        step_type: TrueStepType = "undefined"

        if run.run_type in ["agent", "chain"]:
            step_type = "run"
        elif run.run_type == "llm":
            step_type = "llm"
        elif run.run_type == "retriever":
            step_type = "retrieval"
        elif run.run_type == "tool":
            step_type = "tool"
        elif run.run_type == "embedding":
            step_type = "embedding"

        disable_feedback = not self._is_annotable(run)

        step = Step(
            id=str(run.id),
            name=run.name,
            type=step_type,
            parent_id=parent_id,
            disable_feedback=disable_feedback,
        )
        step.start = datetime.utcnow().isoformat()
        step.input = run.inputs

        self.steps[str(run.id)] = step

        self._run_sync(step.send())

    def _on_run_update(self, run: Run) -> None:
        """Process a run upon update."""
        context_var.set(self.context)

        ignore, parent_id = self._should_ignore_run(run)

        if ignore:
            return

        current_step = self.steps.get(str(run.id), None)

        if run.run_type in ["chain"]:
            if self.generation_sequence:
                self.generation_sequence.pop()

        if run.run_type == "llm":
            provider, llm_settings = self._build_llm_settings(
                (run.serialized or {}), (run.extra or {}).get("invocation_params")
            )
            generations = (run.outputs or {}).get("generations", [])
            llm_output = (run.outputs or {}).get("llm_output")
            completion, language = self._get_completion(generations[0][0])
            current_generation = (
                self.generation_sequence.pop() if self.generation_sequence else None
            )

            if current_generation:
                current_generation.provider = provider
                current_generation.settings = llm_settings
                current_generation.completion = completion
            else:
                generation_type = generations[0][0].get("type", "")
                current_generation = self._build_default_generation(
                    run, generation_type, provider, llm_settings, completion
                )

            if llm_output and current_generation:
                token_count = llm_output.get("token_usage", {}).get("total_tokens")
                current_generation.token_count = token_count

            if current_step:
                current_step.output = completion
                current_step.language = language
                current_step.end = datetime.utcnow().isoformat()
                current_step.generation = current_generation
                self._run_sync(current_step.update())

            if self.final_stream and self.has_streamed_final_answer:
                self.final_stream.content = completion
                self.final_stream.language = language
                self._run_sync(self.final_stream.update())

            return

        outputs = run.outputs or {}
        output_keys = list(outputs.keys())
        output = outputs
        if output_keys:
            output = outputs.get(output_keys[0], outputs)

        if current_step:
            current_step.output = output
            current_step.end = datetime.utcnow().isoformat()
            self._run_sync(current_step.update())

    def _on_error(self, error: BaseException, *, run_id: UUID, **kwargs: Any):
        context_var.set(self.context)

        if current_step := self.steps.get(str(run_id), None):
            current_step.is_error = True
            current_step.output = str(error)
            current_step.end = datetime.utcnow().isoformat()
            self._run_sync(current_step.update())

    on_llm_error = _on_error
    on_chain_error = _on_error
    on_tool_error = _on_error
    on_retriever_error = _on_error


LangchainCallbackHandler = LangchainTracer
AsyncLangchainCallbackHandler = LangchainTracer
