from typing import Any
from chainlit.types import LLMSettings
from typing import List, Optional


def run_langchain_agent(agent: Any, input_str: str):
    if hasattr(agent, "input_keys"):
        input_key = agent.input_keys[0]
        raw_res = agent({input_key: input_str})
    else:
        raw_res = agent(input_str)

    if hasattr(agent, "output_keys"):
        output_key = agent.output_keys[0]
    else:
        output_key = None

    return raw_res, output_key


def get_llm_settings(llm, stop: Optional[List[str]] = None):
    if llm.__class__.__name__ == "OpenAI":
        return LLMSettings(
            model_name=llm.model_name,
            stop=stop,
            temperature=llm.temperature,
            max_tokens=llm.max_tokens,
            top_p=llm.top_p,
            frequency_penalty=llm.frequency_penalty,
            presence_penalty=llm.presence_penalty,
        )
    elif llm.__class__.__name__ == "ChatOpenAI":
        return LLMSettings(
            model_name=llm.model_name,
            stop=stop,
        )
    else:
        return None
