import langchain
from typing import Any, Dict, List, Optional
from chainlit.types import LLMSettings
from langchain.llms import base as llm_base
from langchain.chat_models.base import BaseChatModel
from langchain.callbacks import base as cb_base
from langchain.schema import (
    LLMResult,
    PromptValue,
)

def cbh_on_llm_cache(
    self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
) -> Any:
    pass


cb_base.BaseCallbackHandler.on_llm_cache = cbh_on_llm_cache


def cbm_on_llm_cache(
    self,
    serialized: Dict[str, Any],
    prompts: List[str],
    verbose: bool = False,
    **kwargs: Any
) -> None:
    if not hasattr(self, "handlers"):
        return
    for handler in self.handlers:
        if not handler.ignore_llm:
            if verbose or handler.always_verbose:
                handler.on_llm_cache(serialized, prompts, **kwargs)


cb_base.BaseCallbackManager.on_llm_cache = cbm_on_llm_cache


def get_llm_settings(llm: llm_base.BaseLLM, stop: Optional[List[str]] = None):
    if llm.__class__.__name__ == "OpenAI":
        return LLMSettings(model_name=llm.model_name,
                           stop=stop,
                           temperature=llm.temperature,
                           max_tokens=llm.max_tokens,
                           top_p=llm.top_p,
                           frequency_penalty=llm.frequency_penalty,
                           presence_penalty=llm.presence_penalty,
                           )
    elif llm.__class__.__name__ == "ChatOpenAI":
        return LLMSettings(model_name=llm.model_name,
                           stop=stop,
                           )
    else:
        return None


def generate(
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
    llm_settings = get_llm_settings(self, stop)
    disregard_cache = self.cache is not None and not self.cache
    if langchain.llm_cache is None or disregard_cache:
        # This happens when langchain.cache is None, but self.cache is True
        if self.cache is not None and self.cache:
            raise ValueError(
                "Asked to cache, but no cache found at `langchain.cache`."
            )
        self.callback_manager.on_llm_start(
            {"name": self.__class__.__name__}, prompts, verbose=self.verbose, llm_settings=llm_settings,
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
            {"name": self.__class__.__name__}, missing_prompts, verbose=self.verbose, llm_settings=llm_settings,
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
        self.callback_manager.on_llm_cache(
            {"name": self.__class__.__name__}, prompts, verbose=self.verbose, llm_settings=llm_settings,
        )
        llm_output = {}
    generations = [existing_prompts[i] for i in range(len(prompts))]
    return LLMResult(generations=generations, llm_output=llm_output)


llm_base.BaseLLM.generate = generate


def generate_prompt(
    self, prompts: List[PromptValue], stop: Optional[List[str]] = None
) -> LLMResult:
    prompt_messages = [p.to_messages() for p in prompts]
    prompt_strings = [p.to_string() for p in prompts]
    llm_settings = get_llm_settings(self, stop)

    self.callback_manager.on_llm_start(
        {"name": self.__class__.__name__}, prompt_strings, verbose=self.verbose, llm_settings=llm_settings
    )
    try:
        output = self.generate(prompt_messages, stop=stop)
    except (KeyboardInterrupt, Exception) as e:
        self.callback_manager.on_llm_error(e, verbose=self.verbose)
        raise e
    self.callback_manager.on_llm_end(output, verbose=self.verbose)
    return output


BaseChatModel.generate_prompt = generate_prompt
