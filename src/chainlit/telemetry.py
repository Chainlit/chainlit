import uptrace
from opentelemetry import trace
from functools import wraps
from chainlit.config import config
from chainlit.version import __version__

uptrace.configure_opentelemetry(
    dsn="https://YPa4AbDF853uCW6UWN2oYg@api.uptrace.dev/1778",
    service_name="chainlit",
    service_version="1.0.0",
    deployment_environment="production",
)

tracer = trace.get_tracer("chainlit", __version__)


def trace_event(event_name):
    if config.enable_telemetry:
        with tracer.start_as_current_span(event_name):
            return


def trace(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        event_name = func.__name__
        if config.enable_telemetry:
            with tracer.start_as_current_span(event_name):
                return func(*args, **kwargs)
        else:
            return func(*args, **kwargs)

    return wrapper
