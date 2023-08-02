import os

import openai

import chainlit as cl
from chainlit.playground.providers import OpenAI
from chainlit.sync import make_async
from chainlit.types import Prompt

openai.api_key = os.environ.get("OPENAI_API_KEY")

template = """SQL tables (and columns):
* Customers(customer_id, signup_date)
* Streaming(customer_id, video_id, watch_date, watch_minutes)

A well-written SQL query that {input}:
```"""


settings = {
    "model": "text-davinci-003",
    "temperature": 0,
    "max_tokens": 500,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "stop": ["```"],
}


@cl.on_message
async def main(message: str):
    fromatted_prompt = template.format(input=message)
    response = await make_async(openai.Completion.create)(
        prompt=fromatted_prompt, **settings
    )

    completion = response["choices"][0]["text"]

    prompt = Prompt(
        provider=OpenAI.id,
        settings=settings,
        template=template,
        formatted=fromatted_prompt,
        completion=completion,
    )

    await cl.Message(
        language="sql",
        content=completion,
        prompt=prompt,
    ).send()
