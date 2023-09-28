import chainlit as cl
from fastapi import HTTPException

from fastapi.responses import StreamingResponse

from chainlit.input_widget import Select, Slider, Tags
from chainlit.playground.provider import BaseProvider

vertexai_common_inputs = [
    Slider(
        id="temperature",
        label="Temperature",
        min=0.0,
        max=0.99,
        step=0.01,
        initial=0.2,
    ),
    Slider(
        id="max_output_tokens",
        label="Max Output Tokens",
        min=0.0,
        max=1024,
        step=1,
        initial=256,
    ),
]


class ChatVertexAIProvider(BaseProvider):
    async def create_completion(self, request):
        await super().create_completion(request)
        from vertexai.language_models import ChatModel, CodeChatModel

        self.validate_env(request=request)

        llm_settings = request.prompt.settings
        self.require_settings(llm_settings)

        prompt = self.create_prompt(request)
        model_name = llm_settings["model"]
        if model_name.startswith("chat-"):
            model = ChatModel.from_pretrained(model_name)
        elif model_name.startswith("codechat-"):
            model = CodeChatModel.from_pretrained(model_name)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"This model{model_name} is not implemented.",
            )
        del llm_settings["model"]
        chat = model.start_chat()

        async def create_event_stream():
            for response in await cl.make_async(chat.send_message_streaming)(
                prompt[0].formatted, **llm_settings
            ):
                yield response.text

        return StreamingResponse(create_event_stream())


class GenerationVertexAIProvider(BaseProvider):
    async def create_completion(self, request):
        await super().create_completion(request)
        from vertexai.language_models import TextGenerationModel, CodeGenerationModel

        self.validate_env(request=request)

        llm_settings = request.prompt.settings
        self.require_settings(llm_settings)

        prompt = self.create_prompt(request)
        model_name = llm_settings["model"]
        if model_name.startswith("text-"):
            model = TextGenerationModel.from_pretrained(model_name)
        elif model_name.startswith("code-"):
            model = CodeGenerationModel.from_pretrained(model_name)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"This model{model_name} is not implemented.",
            )
        del llm_settings["model"]

        async def create_event_stream():
            for response in await cl.make_async(model.predict_streaming)(
                prompt, **llm_settings
            ):
                yield response.text

        return StreamingResponse(create_event_stream())


gcp_env_vars = {"google_application_credentials": "GOOGLE_APPLICATION_CREDENTIALS"}

ChatVertexAI = ChatVertexAIProvider(
    id="chat-vertexai",
    env_vars=gcp_env_vars,
    name="ChatVertexAI",
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["chat-bison", "codechat-bison"],
            initial_value="chat-bison",
        ),
        *vertexai_common_inputs,
    ],
    is_chat=True,
)

GenerationVertexAI = GenerationVertexAIProvider(
    id="generation-vertexai",
    env_vars=gcp_env_vars,
    name="GenerationVertexAI",
    inputs=[
        Select(
            id="model",
            label="Model",
            values=["text-bison", "code-bison"],
            initial_value="text-bison",
        ),
        *vertexai_common_inputs,
    ],
    is_chat=False,
)
