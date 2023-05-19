from typing import Union
import time
import uuid
from chainlit.session import Session
from chainlit.types import LLMSettings, AskSpec
from chainlit.client import BaseClient
from socketio.exceptions import TimeoutError
import inspect


def current_milli_time():
    """Get the current time in milliseconds."""
    return round(time.time() * 1000)


class Chainlit:
    """
    Chainlit SDK class. The SDK is not directly exposed to the developer.
    Instead, the developer interacts with the SDK through the methods exposed in the __init__ file.
    """

    session: Session

    def __init__(self, session: Session) -> None:
        """Initialize Chainlit with the user session."""
        self.session = session

    def _get_session_property(self, property_name: str):
        """Helper method to get a property from the session."""
        if not hasattr(self, "session") or property_name not in self.session:
            return None
        return self.session[property_name]

    @property
    def emit(self):
        """Get the 'emit' property from the session."""
        return self._get_session_property("emit")

    @property
    def ask_user(self):
        """Get the 'ask_user' property from the session."""
        return self._get_session_property("ask_user")

    @property
    def client(self) -> Union[BaseClient, None]:
        """Get the 'client' property from the session."""
        return self._get_session_property("client")

    def send_message(
        self,
        author: str,
        content: str,
        prompt: str = None,
        language: str = None,
        indent=0,
        is_error=False,
        llm_settings: LLMSettings = None,
        end_stream=False,
    ):
        """Send a message to the UI."""
        if not self.emit:
            return

        if llm_settings is None and prompt is not None:
            llm_settings = LLMSettings()

        if llm_settings:
            llm_settings = llm_settings.to_dict()

        msg = {
            "author": author,
            "content": content,
            "indent": indent,
            "language": language,
            "isError": is_error,
            "prompt": prompt,
            "llmSettings": llm_settings,
        }
        if self.client:
            message_id = self.client.create_message(msg)
            msg["id"] = message_id
        else:
            message_id = uuid.uuid4().hex
            msg["tempId"] = message_id

        msg["createdAt"] = current_milli_time()

        if end_stream:
            self.stream_end(msg)
        else:
            self.emit("message", msg)

        return str(message_id)

    def send_ask_timeout(self, author: str):
        """Send a prompt timeout message to the UI."""
        self.send_message(author=author, content="Time out", is_error=True)

        if self.emit:
            self.emit("ask_timeout", {})

    def clear_ask(self):
        """Clear the prompt from the UI."""
        if self.emit:
            self.emit("clear_ask", {})

    def send_ask_user(
        self, author: str, content: str, spec: AskSpec, raise_on_timeout=False
    ):
        """Send a prompt to the UI and wait for a response."""
        if not self.ask_user:
            return

        msg = {
            "author": author,
            "content": content,
            "waitForAnswer": True,
        }

        if self.client:
            message_id = self.client.create_message(msg)
            msg["id"] = message_id

        msg["createdAt"] = current_milli_time()

        try:
            # End the task temporarily so that the User can answer the prompt
            self.task_end()
            # Send the prompt to the UI
            res = self.ask_user({"msg": msg, "spec": spec.to_dict()}, spec.timeout)
            if self.client and res:
                # If cloud is enabled, store the response in the database/S3
                if spec.type == "text":
                    res_msg = {
                        "author": res["author"],
                        "authorIsUser": True,
                        "content": res["content"],
                    }
                    self.client.create_message(res_msg)
                elif spec.type == "file":
                    # TODO: upload file to S3
                    pass

            self.clear_ask()
            return res
        except TimeoutError as e:
            self.send_ask_timeout(author)
            if raise_on_timeout:
                raise e
        finally:
            self.task_start()

    def update_token_count(self, count: int):
        """Update the token count for the UI."""
        if not self.emit:
            return
        self.emit("token_usage", count)

    def task_start(self):
        """
        Send a task start signal to the UI.
        """
        if self.emit:
            self.emit("task_start", {})

    def task_end(self):
        """Send a task end signal to the UI."""
        if self.emit:
            self.emit("task_end", {})

    def stream_start(
        self,
        author: str,
        indent: int,
        language: str = None,
        llm_settings: LLMSettings = None,
    ):
        """Send a stream start signal to the UI."""
        if self.emit:
            self.emit(
                "stream_start",
                {
                    "author": author,
                    "indent": indent,
                    "language": language,
                    "content": "",
                    "llmSettings": llm_settings.to_dict() if llm_settings else None,
                },
            )

    def send_token(self, token: str):
        """Send a message token to the UI."""
        if self.emit:
            self.emit("stream_token", token)

    def stream_end(self, msg):
        """Send a stream end signal to the UI."""
        if self.emit:
            self.emit("stream_end", msg)


def get_sdk() -> Union[Chainlit, None]:
    """
    Get the Chainlit SDK instance from the current call stack.
    This unusual approach is necessary because:
     - we need to get the right SDK instance with the right websocket connection
     - to preserve a lean developer experience, we do not pass the SDK instance to every function call

    What happens is that we set __chainlit_sdk__ in the local variables when we receive a websocket message.
    Then we can retrieve it from the call stack when we need it, even if the developer's code has no idea about it.
    """
    attr = "__chainlit_sdk__"
    candidates = [i[0].f_locals.get(attr) for i in inspect.stack()]
    sdk = None
    for candidate in candidates:
        if candidate:
            sdk = candidate
            break
    return sdk


def get_emit():
    sdk = get_sdk()
    if sdk:
        return sdk.emit
    return None
