import langchain
from typing import List, Optional
from langchain.llms import base as llm_base
from langchain.chat_models.base import BaseChatModel
from langchain.schema import (
    LLMResult,
    PromptValue,
)
from langchain.callbacks import get_callback_manager
from chainlit.lc.chainlit_handler import ChainlitCallbackHandler
from chainlit.lc.utils import get_llm_settings

# Monkey patch LangChain <= 0.0.153


def patched_generate(
    self: llm_base.BaseLLM, prompts: List[str], stop: Optional[List[str]] = None
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
    if langchain.llm_cache is None or disregard_cache:
        # This happens when langchain.cache is None, but self.cache is True
        if self.cache is not None and self.cache:
            raise ValueError("Asked to cache, but no cache found at `langchain.cache`.")
        self.callback_manager.on_llm_start(
            {"name": self.__class__.__name__},
            prompts,
            verbose=self.verbose,
            llm_settings=llm_settings,
        )
        try:
            output = self._generate(prompts, stop=stop)
        except (KeyboardInterrupt, Exception) as e:
            self.callback_manager.on_llm_error(e, verbose=self.verbose)
            raise e
        self.callback_manager.on_llm_end(output, verbose=self.verbose)
        return output
    params = self.dict()
    params["stop"] = stop
    (
        existing_prompts,
        llm_string,
        missing_prompt_idxs,
        missing_prompts,
    ) = llm_base.get_prompts(params, prompts)

    if len(missing_prompts) > 0:
        self.callback_manager.on_llm_start(
            {"name": self.__class__.__name__},
            missing_prompts,
            verbose=self.verbose,
            llm_settings=llm_settings,
        )
        try:
            new_results = self._generate(missing_prompts, stop=stop)
        except (KeyboardInterrupt, Exception) as e:
            self.callback_manager.on_llm_error(e, verbose=self.verbose)
            raise e
        self.callback_manager.on_llm_end(new_results, verbose=self.verbose)
        llm_output = llm_base.update_cache(
            existing_prompts, llm_string, missing_prompt_idxs, new_results, prompts
        )
    else:
        # PATCH
        self.callback_manager.on_llm_start(
            {"name": self.__class__.__name__},
            prompts,
            verbose=self.verbose,
            llm_settings=llm_settings,
        )
        llm_output = {}
        self.callback_manager.on_llm_end(
            LLMResult(generations=[], llm_output=llm_output), verbose=self.verbose
        )
    generations = [existing_prompts[i] for i in range(len(prompts))]
    return LLMResult(generations=generations, llm_output=llm_output)


llm_base.BaseLLM.generate = patched_generate


def patched_generate_prompt(
    self, prompts: List[PromptValue], stop: Optional[List[str]] = None
) -> LLMResult:
    prompt_messages = [p.to_messages() for p in prompts]
    prompt_strings = [p.to_string() for p in prompts]

    # PATCH
    llm_settings = get_llm_settings(self, stop)
    self.callback_manager.on_llm_start(
        {"name": self.__class__.__name__},
        prompt_strings,
        verbose=self.verbose,
        llm_settings=llm_settings,
    )

    try:
        output = self.generate(prompt_messages, stop=stop)
    except (KeyboardInterrupt, Exception) as e:
        self.callback_manager.on_llm_error(e, verbose=self.verbose)
        raise e
    self.callback_manager.on_llm_end(output, verbose=self.verbose)
    return output


BaseChatModel.generate_prompt = patched_generate_prompt


get_callback_manager()._callback_manager.add_handler(ChainlitCallbackHandler())
