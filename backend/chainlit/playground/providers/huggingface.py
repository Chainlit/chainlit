from typing import Optional

from chainlit.input_widget import Slider
from chainlit.playground.provider import BaseProvider
from chainlit.sync import make_async
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from pydantic.dataclasses import dataclass


@dataclass
class BaseHuggingFaceProvider(BaseProvider):
    repo_id: Optional[str] = None
    task = "text2text-generation"

    async def create_completion(self, request):
        await super().create_completion(request)
        from huggingface_hub.inference_api import InferenceApi

        env_settings = self.validate_env(request=request)
        llm_settings = request.generation.settings
        self.require_settings(llm_settings)

        client = InferenceApi(
            repo_id=self.repo_id,
            token=env_settings["api_token"],
            task=self.task,
        )

        prompt = self.create_generation(request)

        response = await make_async(client)(inputs=prompt, params=llm_settings)

        if "error" in response:
            raise HTTPException(
                status_code=500,
                detail=f"Error raised by inference API: {response['error']}",
            )
        if client.task == "text2text-generation":

            def create_event_stream():
                yield response[0]["generated_text"]

            return StreamingResponse(create_event_stream())
        else:
            raise HTTPException(status_code=400, detail="Unsupported task")


flan_hf_env_vars = {"api_token": "HUGGINGFACE_API_TOKEN"}

HFFlanT5 = BaseHuggingFaceProvider(
    id="huggingface_hub",
    repo_id="declare-lab/flan-alpaca-large",
    name="Flan Alpaca Large",
    env_vars=flan_hf_env_vars,
    inputs=[
        Slider(
            id="temperature",
            label="Temperature",
            min=0.0,
            max=1.0,
            step=0.01,
            initial=0.9,
        ),
        Slider(
            id="max_length",
            label="Completion max length",
            min=1.0,
            max=5000,
            step=1.0,
            initial=256,
        ),
    ],
    is_chat=False,
)
