from fastapi.responses import StreamingResponse

from chainlit.input_widget import Slider
from chainlit.playground.provider import BaseProvider
from chainlit.sync import make_async
from pydantic.dataclasses import dataclass


@dataclass
class BaseHuggingFaceProvider(BaseProvider):
    repo_id: str
    task = "text2text-generation"

    async def create_completion(self, request):
        await super().create_completion(request)
        from huggingface_hub.inference_api import InferenceApi

        env_settings = self.validate_env(request=request)

        self.require_settings(request.settings)
        self.require_prompt(request)

        client = InferenceApi(
            repo_id=self.repo_id,
            token=env_settings["api_token"],
            task=self.task,
        )

        prompt = self.create_prompt(request)

        async def create_event_stream():
            response = await make_async(client)(inputs=prompt, params=request.settings)

            if "error" in response:
                raise ValueError(f"Error raised by inference API: {response['error']}")
            if client.task == "text2text-generation":
                # Text generation return includes the starter text.
                yield response[0]["generated_text"]
            else:
                raise ValueError("Unsupported task")

        return StreamingResponse(create_event_stream())


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
            max=100000,
            step=1.0,
            initial=1000,
        ),
    ],
    is_chat=False,
)
