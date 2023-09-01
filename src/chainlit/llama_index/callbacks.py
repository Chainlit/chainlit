import asyncio
from typing import Any, Dict, List, Optional

from llama_index.callbacks.base import BaseCallbackHandler
from llama_index.callbacks.schema import CBEventType, EventPayload
from llama_index.llms.base import ChatMessage, ChatResponse, CompletionResponse

from chainlit.context import context_var
from chainlit.element import Text
from chainlit.message import Message
from chainlit.prompt import Prompt, PromptMessage

DEFAULT_IGNORE = [
    CBEventType.CHUNKING,
    CBEventType.SYNTHESIZE,
    CBEventType.EMBEDDING,
    CBEventType.NODE_PARSING,
    CBEventType.QUERY,
    CBEventType.TREE,
]


class LlamaIndexCallbackHandler(BaseCallbackHandler):
    """Base callback handler that can be used to track event starts and ends."""

    def __init__(
        self,
        event_starts_to_ignore: List[CBEventType] = DEFAULT_IGNORE,
        event_ends_to_ignore: List[CBEventType] = DEFAULT_IGNORE,
    ) -> None:
        """Initialize the base callback handler."""
        self.context = context_var.get()
        self.event_starts_to_ignore = tuple(event_starts_to_ignore)
        self.event_ends_to_ignore = tuple(event_ends_to_ignore)

    def _restore_context(self) -> None:
        """Restore Chainlit context in the current thread

        Chainlit context is local to the main thread, and LlamaIndex
        runs the callbacks in its own threads, so they don't have a
        Chainlit context by default.

        This method restores the context in which the callback handler
        has been created (it's always created in the main thread), so
        that we can actually send messages.
        """
        context_var.set(self.context)

    def _get_parent_id(self) -> Optional[str]:
        """Get the parent message id"""
        if root_message := self.context.session.root_message:
            return root_message.id
        return None

    def on_event_start(
        self,
        event_type: CBEventType,
        payload: Optional[Dict[str, Any]] = None,
        event_id: str = "",
        **kwargs: Any,
    ) -> str:
        """Run when an event starts and return id of event."""
        self._restore_context()
        asyncio.run(
            Message(
                content="",
                author=event_type,
                parent_id=self._get_parent_id(),
            ).send()
        )

        return event_id

    def on_event_end(
        self,
        event_type: CBEventType,
        payload: Optional[Dict[str, Any]] = None,
        event_id: str = "",
        **kwargs: Any,
    ) -> None:
        """Run when an event ends."""
        if payload is None:
            return

        self._restore_context()

        if event_type == CBEventType.RETRIEVE:
            sources = payload.get(EventPayload.NODES)
            if sources:
                elements = [
                    Text(name=f"Source {idx}", content=source.node.get_text())
                    for idx, source in enumerate(sources)
                ]
                source_refs = "\, ".join(
                    [f"Source {idx}" for idx, _ in enumerate(sources)]
                )
                content = f"Retrieved the following sources: {source_refs}"

                asyncio.run(
                    Message(
                        content=content,
                        author=event_type,
                        elements=elements,
                        parent_id=self._get_parent_id(),
                    ).send()
                )

        if event_type == CBEventType.LLM:
            formatted_messages = payload.get(
                EventPayload.MESSAGES
            )  # type: Optional[List[ChatMessage]]
            formatted_prompt = payload.get(EventPayload.PROMPT)
            response = payload.get(EventPayload.RESPONSE)

            if formatted_messages:
                messages = [
                    PromptMessage(role=m.role.value, formatted=m.content)
                    for m in formatted_messages
                ]
            else:
                messages = None

            if isinstance(response, ChatResponse):
                content = response.message.content or ""
            elif isinstance(response, CompletionResponse):
                content = response.text
            else:
                content = ""

            asyncio.run(
                Message(
                    content=content,
                    author=event_type,
                    parent_id=self._get_parent_id(),
                    prompt=Prompt(
                        formatted=formatted_prompt,
                        messages=messages,
                        completion=content,
                    ),
                ).send()
            )

    def _noop(self, *args, **kwargs):
        pass

    start_trace = _noop
    end_trace = _noop
