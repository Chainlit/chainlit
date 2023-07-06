from typing import Union, Dict
from chainlit.session import Session
from chainlit.types import AskSpec
from chainlit.client.base import BaseDBClient
from socketio.exceptions import TimeoutError


class ChainlitEmitter:
    """
    Chainlit Emitter class. The Emitter is not directly exposed to the developer.
    Instead, the developer interacts with the Emitter through the methods and classes exposed in the __init__ file.
    """

    session: Session

    def __init__(self, session: Session) -> None:
        """Initialize with the user session."""
        self.session = session

    def _get_session_property(self, property_name: str, raise_error=True):
        """Helper method to get a property from the session."""
        if not hasattr(self, "session") or property_name not in self.session:
            if raise_error:
                raise ValueError(f"Session does not have property '{property_name}'")
            else:
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
    def db_client(self) -> Union[BaseDBClient, None]:
        """Get the 'client' property from the session."""
        return self._get_session_property("db_client", raise_error=False)

    def send_message(self, msg_dict: Dict):
        """Send a message to the UI."""

        return self.emit("new_message", msg_dict)

    def update_message(self, msg_dict: Dict):
        """Update a message in the UI."""

        return self.emit("update_message", msg_dict)

    def delete_message(self, msg_dict):
        """Delete a message in the UI."""

        return self.emit("delete_message", msg_dict)

    def send_ask_timeout(self):
        """Send a prompt timeout message to the UI."""

        return self.emit("ask_timeout", {})

    def clear_ask(self):
        """Clear the prompt from the UI."""

        return self.emit("clear_ask", {})

    async def send_ask_user(
        self, msg_dict: Dict, spec: AskSpec, raise_on_timeout=False
    ):
        """Send a prompt to the UI and wait for a response."""

        try:
            # Send the prompt to the UI
            res = await self.ask_user(
                {"msg": msg_dict, "spec": spec.to_dict()}, spec.timeout
            )

            # End the task temporarily so that the User can answer the prompt
            await self.task_end()

            if self.db_client and res:
                # If cloud is enabled, store the response in the database/S3
                if spec.type == "text":
                    res_msg = {
                        "author": res["author"],
                        "authorIsUser": True,
                        "content": res["content"],
                    }
                    await self.db_client.create_message(res_msg)
                elif spec.type == "file":
                    # TODO: upload file to S3
                    pass

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

    def stream_start(self, msg_dict: Dict):
        """Send a stream start signal to the UI."""
        return self.emit(
            "stream_start",
            msg_dict,
        )

    def send_token(self, id: Union[str, int], token: str, is_sequence=False):
        """Send a message token to the UI."""
        return self.emit(
            "stream_token", {"id": id, "token": token, "isSequence": is_sequence}
        )
