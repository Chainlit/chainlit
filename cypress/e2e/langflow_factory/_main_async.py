import json
from langchain.chains import LLMChain
import chainlit as cl


with open("./schema.json", "r") as f:
    schema = json.load(f)


@cl.langflow_factory(
    schema=schema,
    use_async=True,
)
def factory(chain: LLMChain):
    # Modify your agent here if needed
    return chain
