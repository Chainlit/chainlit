import inspect
import langchain
from typing import List, Optional
from langchain.llms.base import BaseLLM, update_cache, get_prompts
from langchain.chat_models.base import BaseChatModel
from langchain.schema import (
    LLMResult,
)
from langchain.callbacks.manager import (
    CallbackManager,
    Callbacks,
)
from langchain.schema import (
    BaseMessage,
    LLMResult,
    get_buffer_string,
)
from chainlit.lc.utils import get_llm_settings
from chainlit.lc.chainlit_handler import ChainlitCallbackHandler

# Monkey patch LangChain > 0.0.153
chainlit_handler = ChainlitCallbackHandler()

orig_configure = CallbackManager.configure


def patched_configure(
    inheritable_callbacks: Callbacks = None,
    local_callbacks: Callbacks = None,
    verbose: bool = False,
):
    cbm = orig_configure(inheritable_callbacks, local_callbacks, verbose)
    cbm.add_handler(chainlit_handler, False)
    return cbm


CallbackManager.configure = patched_configure


def patched_generate(
    self,
    prompts: List[str],
    stop: Optional[List[str]] = None,
    callbacks: Callbacks = None,
) -> LLMResult:
    """Run the LLM on the given prompt and input."""
    # If string is passed in directly no errors will be raised but outputs will
    # not make sense.
    if not isinstance(prompts, list):
        raise ValueError(
            "Argument 'prompts' is expected to be of type List[str], received"
            f" argument of type {type(prompts)}."
        )
    # PATCH
    llm_settings = get_llm_settings(self, stop)
    disregard_cache = self.cache is not None and not self.cache
    callback_manager = CallbackManager.configure(
        callbacks, self.callbacks, self.verbose
    )
    new_arg_supported = inspect.signature(self._generate).parameters.get("run_manager")
    if langchain.llm_cache is None or disregard_cache:
        # This happens when langchain.cache is None, but self.cache is True
        if self.cache is not None and self.cache:
            raise ValueError("Asked to cache, but no cache found at `langchain.cache`.")
        # PATCH
        run_manager = callback_manager.on_llm_start(
            {"name": self.__class__.__name__}, prompts, llm_settings=llm_settings
        )
        try:
            output = (
                self._generate(prompts, stop=stop, run_manager=run_manager)
                if new_arg_supported
                else self._generate(prompts, stop=stop)
            )
        except (KeyboardInterrupt, Exception) as e:
            run_manager.on_llm_error(e)
            raise e
        run_manager.on_llm_end(output)
        return output
    params = self.dict()
    params["stop"] = stop
    (
        existing_prompts,
        llm_string,
        missing_prompt_idxs,
        missing_prompts,
    ) = get_prompts(params, prompts)
    if len(missing_prompts) > 0:
        # PATCH
        run_manager = callback_manager.on_llm_start(
            {"name": self.__class__.__name__},
            missing_prompts,
            llm_settings=llm_settings,
        )
        try:
            new_results = (
                self._generate(missing_prompts, stop=stop, run_manager=run_manager)
                if new_arg_supported
                else self._generate(missing_prompts, stop=stop)
            )
        except (KeyboardInterrupt, Exception) as e:
            run_manager.on_llm_error(e)
            raise e
        run_manager.on_llm_end(new_results)
        llm_output = update_cache(
            existing_prompts, llm_string, missing_prompt_idxs, new_results, prompts
        )
    else:
        # PATCH
        run_manager = callback_manager.on_llm_start(
            {"name": self.__class__.__name__},
            prompts,
            verbose=self.verbose,
            llm_settings=llm_settings,
        )
        llm_output = {}
        run_manager.on_llm_end(
            LLMResult(generations=[], llm_output=llm_output), verbose=self.verbose
        )

    generations = [existing_prompts[i] for i in range(len(prompts))]
    return LLMResult(generations=generations, llm_output=llm_output)


BaseLLM.generate = patched_generate


def patched_chat_generate(
    self,
    messages: List[List[BaseMessage]],
    stop: Optional[List[str]] = None,
    callbacks: Callbacks = None,
) -> LLMResult:
    """Top Level call"""

    # PATCH
    llm_settings = get_llm_settings(self, stop)

    callback_manager = CallbackManager.configure(
        callbacks, self.callbacks, self.verbose
    )
    message_strings = [get_buffer_string(m) for m in messages]

    # PATCH
    run_manager = callback_manager.on_llm_start(
        {"name": self.__class__.__name__}, message_strings, llm_settings=llm_settings
    )

    new_arg_supported = inspect.signature(self._generate).parameters.get("run_manager")
    try:
        results = [
            self._generate(m, stop=stop, run_manager=run_manager)
            if new_arg_supported
            else self._generate(m, stop=stop)
            for m in messages
        ]
    except (KeyboardInterrupt, Exception) as e:
        run_manager.on_llm_error(e)
        raise e
    llm_output = self._combine_llm_outputs([res.llm_output for res in results])
    generations = [res.generations for res in results]
    output = LLMResult(generations=generations, llm_output=llm_output)
    run_manager.on_llm_end(output)
    return output


BaseChatModel.generate = patched_chat_generate
