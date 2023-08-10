import os

import openai

import chainlit as cl
from chainlit.sync import make_async

openai.api_key = os.environ.get("OPENAI_API_KEY")

prompt = """SQL tables (and columns):
* Customers(customer_id, signup_date)
* Streaming(customer_id, video_id, watch_date, watch_minutes)

A well-written SQL query that {input}:
```"""

model_name = "text-davinci-003"

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
    fromatted_prompt = prompt.format(input=message)
    response = await make_async(openai.Completion.create)(
        model=model_name, prompt=fromatted_prompt, **settings
    )

    content = response["choices"][0]["text"]

    await cl.Message(
        language="sql",
        content=content,
        prompt=fromatted_prompt,
        llm_settings=cl.LLMSettings(model_name=model_name, **settings),
    ).send()
