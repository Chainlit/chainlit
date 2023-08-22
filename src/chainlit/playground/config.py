from typing import List

from chainlit.playground.provider import BaseProvider
from chainlit.playground.providers import (
    Anthropic,
    AzureChatOpenAI,
    AzureOpenAI,
    ChatOpenAI,
    HFFlanT5,
    OpenAI,
)

providers = []  # type: List[BaseProvider]
default_providers = [
    AzureChatOpenAI,
    AzureOpenAI,
    ChatOpenAI,
    OpenAI,
    Anthropic,
    HFFlanT5,
]  # type: List[BaseProvider]


def add_llm_provider(provider: BaseProvider):
    if not provider.is_configured():
        raise ValueError(
            f"{provider.name} LLM provider requires the following environment variables: {', '.join(provider.env_vars.values())}"
        )
    providers.append(provider)


def get_llm_providers():
    list = default_providers if len(providers) == 0 else providers

    return [provider for provider in list if provider.is_configured()]
