import asyncio
import uuid
from typing import Any, Dict, List, Optional, Union, cast

from chainlit.data import get_data_layer
from chainlit.element import Element, File
from chainlit.message import Message, MessageDict
from chainlit.session import BaseSession, WebsocketSession
from chainlit.step import StepDict
from chainlit.types import AskFileResponseDict, AskSpec, ThreadDict, UIMessagePayload
from socketio.exceptions import TimeoutError


class BaseChainlitEmitter:
    """
    Chainlit Emitter Stub class. This class is used for testing purposes.
    It stubs the ChainlitEmitter class and does nothing on function calls.
    """

    session: BaseSession

    def __init__(self, session: BaseSession) -> None:
        """Initialize with the user session."""
        self.session = session

    async def emit(self, event: str, data: Any):
        """Stub method to get the 'emit' property from the session."""
        pass

    async def ask_user(self):
        """Stub method to get the 'ask_user' property from the session."""
        pass

    async def resume_thread(self, thread_dict: ThreadDict):
        """Stub method to resume a thread."""
        pass

    async def send_message(self, msg_dict: Union[MessageDict, StepDict]):
        """Stub method to send a message to the UI."""
        pass

    async def update_message(self, msg_dict: Union[MessageDict, StepDict]):
        """Stub method to update a message in the UI."""
        pass

    async def delete_message(self, msg_dict: Union[MessageDict, StepDict]):
        """Stub method to delete a message in the UI."""
        pass

    async def send_ask_timeout(self):
        """Stub method to send a prompt timeout message to the UI."""
        pass

    async def clear_ask(self):
        """Stub method to clear the prompt from the UI."""
        pass

    async def init_thread(self, msg_dict: MessageDict):
        """Signal the UI that a new thread (with a user message) exists"""
        pass

    async def process_user_message(self, payload: UIMessagePayload) -> Message:
        """Stub method to process user message."""
        return Message(content="")

    async def send_ask_user(
        self, msg_dict: MessageDict, spec: AskSpec, raise_on_timeout=False
    ):
        """Stub method to send a prompt to the UI and wait for a response."""
        pass

    async def update_token_count(self, count: int):
        """Stub method to update the token count for the UI."""
        pass

    async def task_start(self):
        """Stub method to send a task start signal to the UI."""
        pass

    async def task_end(self):
        """Stub method to send a task end signal to the UI."""
        pass

    async def stream_start(self, msg_dict: Union[MessageDict, StepDict]):
        """Stub method to send a stream start signal to the UI."""
        pass

    async def send_token(self, id: str, token: str, is_sequence=False):
        """Stub method to send a message token to the UI."""
        pass

    async def set_chat_settings(self, settings: dict):
        """Stub method to set chat settings."""
        pass


class ChainlitEmitter(BaseChainlitEmitter):
    """
    Chainlit Emitter class. The Emitter is not directly exposed to the developer.
    Instead, the developer interacts with the Emitter through the methods and classes exposed in the __init__ file.
    """

    session: WebsocketSession

    def __init__(self, session: WebsocketSession) -> None:
        """Initialize with the user session."""
        self.session = session

    def _get_session_property(self, property_name: str, raise_error=True):
        """Helper method to get a property from the session."""
        if not hasattr(self, "session") or not hasattr(self.session, property_name):
            if raise_error:
                raise ValueError(f"Session does not have property '{property_name}'")
            else:
                return None
        return getattr(self.session, property_name)

    @property
    def emit(self):
        """Get the 'emit' property from the session."""

        return self._get_session_property("emit")

    @property
    def ask_user(self):
        """Get the 'ask_user' property from the session."""
        return self._get_session_property("ask_user")

    def resume_thread(self, thread_dict: ThreadDict):
        """Send a thread to the UI to resume it"""
        return self.emit("resume_thread", thread_dict)

    def send_message(self, msg_dict: Union[MessageDict, StepDict]):
        """Send a message to the UI."""
        return self.emit("new_message", msg_dict)

    def update_message(self, msg_dict: Union[MessageDict, StepDict]):
        """Update a message in the UI."""

        return self.emit("update_message", msg_dict)

    def delete_message(self, msg_dict: Union[MessageDict, StepDict]):
        """Delete a message in the UI."""

        return self.emit("delete_message", msg_dict)

    def send_ask_timeout(self):
        """Send a prompt timeout message to the UI."""

        return self.emit("ask_timeout", {})

    def clear_ask(self):
        """Clear the prompt from the UI."""

        return self.emit("clear_ask", {})

    async def init_thread(self, message: MessageDict):
        """Signal the UI that a new thread (with a user message) exists"""
        if data_layer := get_data_layer():
            await data_layer.update_thread(
                self.session.thread_id, {"name": message["content"]}
            )
            await self.session.flush_method_queue()

        await self.emit("init_thread", message)

    async def process_user_message(self, payload: UIMessagePayload):
        message_dict = payload["message"]
        files = payload["files"]
        # UUID generated by the frontend should use v4
        assert uuid.UUID(message_dict["id"]).version == 4

        message = Message.from_dict(message_dict)

        asyncio.create_task(message._create())

        if not self.session.has_user_message:
            self.session.has_user_message = True
            await self.init_thread(message.to_dict())

        if files:
            file_elements = [Element.from_dict(file) for file in files]
            message.elements = file_elements

            async def send_elements():
                for element in message.elements:
                    await element.send(for_id=message.id)

            asyncio.create_task(send_elements())

        self.session.root_message = message

        return message

    async def send_ask_user(
        self, msg_dict: MessageDict, spec: AskSpec, raise_on_timeout=False
    ):
        """Send a prompt to the UI and wait for a response."""

        try:
            # Send the prompt to the UI
            res = await self.ask_user(
                {"msg": msg_dict, "spec": spec.to_dict()}, spec.timeout
            )  # type: Optional[Union["MessageDict", List["AskFileResponseDict"]]]

            # End the task temporarily so that the User can answer the prompt
            await self.task_end()

            if res:
                message_dict_res = cast(MessageDict, res)
                if spec.type == "text":
                    await self.process_user_message(
                        {"message": message_dict_res, "files": None}
                    )
                elif spec.type == "file":
                    file_response_list_res = cast(List[AskFileResponseDict], res)
                    if get_data_layer():
                        coros = [
                            File(
                                content=file["content"],
                                mime=file["type"],
                                for_id=msg_dict["id"],
                            )._upload_and_persist()
                            for file in file_response_list_res
                        ]
                        await asyncio.gather(*coros)

            await self.clear_ask()
            return res
        except TimeoutError as e:
            await self.send_ask_timeout()

            if raise_on_timeout:
                raise e
        finally:
            await self.task_start()

    def update_token_count(self, count: int):
        """Update the token count for the UI."""

        return self.emit("token_usage", count)

    def task_start(self):
        """
        Send a task start signal to the UI.
        """
        return self.emit("task_start", {})

    def task_end(self):
        """Send a task end signal to the UI."""
        return self.emit("task_end", {})

    def stream_start(self, msg_dict: Union[MessageDict, StepDict]):
        """Send a stream start signal to the UI."""
        return self.emit(
            "stream_start",
            msg_dict,
        )

    def send_token(self, id: str, token: str, is_sequence=False):
        """Send a message token to the UI."""
        return self.emit(
            "stream_token", {"id": id, "token": token, "isSequence": is_sequence}
        )

    def set_chat_settings(self, settings: Dict[str, Any]):
        self.session.chat_settings = settings
