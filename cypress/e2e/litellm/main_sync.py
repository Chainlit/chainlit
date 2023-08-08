import os

import litellm
from litellm import completion

import chainlit as cl
from chainlit.sync import make_async

prompt = """SQL tables (and columns):
* Customers(customer_id, signup_date)
* Streaming(customer_id, video_id, watch_date, watch_minutes)

A well-written SQL query that {input}:
```"""

model_name = "text-davinci-003" # replace for any model in litellm.model_list (E.g. 'claude-instant-1', 'gpt-3.5-turbo', 'command-nightly', ...)

settings = {
    "temperature": 0,
    "max_tokens": 500,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "stop": ["```"],
}


@cl.on_message
async def main(message: str):
    formatted_prompt = prompt.format(input=message)
    messages = [{"role": "user", "content": formatted_prompt}]
    response = completion(
        model=model_name, messages=messages, **settings
    )

    content = response['choices'][0]['message']['content']

    await cl.Message(
        language="sql",
        content=content,
        prompt=fromatted_prompt,
        llm_settings=cl.LLMSettings(model_name=model_name, **settings),
    ).send()
