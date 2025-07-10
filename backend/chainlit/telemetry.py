"""
Stub implementation for telemetry functionality.
All telemetry has been removed from Chainlit.
"""

from functools import wraps
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from opentelemetry.trace import Tracer


def trace_event(event_name: str) -> None:
    """
    Stub function that does nothing.
    Previously used for telemetry event tracking.
    """
    pass


def trace(func):
    """
    Decorator stub that does nothing.
    Previously used for telemetry function tracing.
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


class ChainlitTelemetry:
    """
    Stub class for telemetry functionality.
    All telemetry has been removed from Chainlit.
    """

    def __init__(self):
        self._tracer = None

    @property
    def tracer(self) -> "Tracer":
        """
        Stub property that returns None.
        Previously used for telemetry tracing.
        """
        return None  # type: ignore


chainlit_telemetry = ChainlitTelemetry()
