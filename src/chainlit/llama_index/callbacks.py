from typing import Any, Dict, List, Optional


from llama_index.callbacks.base import BaseCallbackHandler
from llama_index.callbacks.schema import CBEventType, EventPayload

from chainlit.context import get_emitter
from chainlit.message import Message
from chainlit.element import Text
from chainlit.sync import run_sync


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

    # Message at the root of the chat we should attach child messages to
    root_message: Message = None

    def __init__(
        self,
        event_starts_to_ignore: List[CBEventType] = DEFAULT_IGNORE,
        event_ends_to_ignore: List[CBEventType] = DEFAULT_IGNORE,
    ) -> None:
        """Initialize the base callback handler."""
        self.event_starts_to_ignore = tuple(event_starts_to_ignore)
        self.event_ends_to_ignore = tuple(event_ends_to_ignore)

    def on_event_start(
        self,
        event_type: CBEventType,
        payload: Optional[Dict[str, Any]] = None,
        event_id: str = "",
        **kwargs: Any,
    ) -> str:
        """Run when an event starts and return id of event."""
        run_sync(
            Message(
                author=event_type,
                indent=1,
                content="",
            ).send()
        )
        return ""

    def on_event_end(
        self,
        event_type: CBEventType,
        payload: Optional[Dict[str, Any]] = None,
        event_id: str = "",
        **kwargs: Any,
    ) -> None:
        """Run when an event ends."""

        parent_id = self.root_message.id if self.root_message else None

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

                run_sync(
                    Message(
                        content=content,
                        author=event_type,
                        elements=elements,
                        parent_id=parent_id,
                    ).send()
                )

        if event_type == CBEventType.LLM:
            run_sync(
                Message(
                    content=payload.get(EventPayload.RESPONSE, ""),
                    author=event_type,
                    parent_id=parent_id,
                    prompt=payload.get(EventPayload.PROMPT),
                ).send()
            )

    def start_trace(self, trace_id: Optional[str] = None) -> None:
        """Run when an overall trace is launched."""
        emitter = get_emitter()
        self.root_message = emitter.session.root_message

    def end_trace(
        self,
        trace_id: Optional[str] = None,
        trace_map: Optional[Dict[str, List[str]]] = None,
    ) -> None:
        """Run when an overall trace is exited."""

        self.root_message = None
