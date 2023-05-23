import uptrace
import hashlib
from socket import gethostname
from opentelemetry.sdk.resources import Attributes, Resource
from opentelemetry import trace as ot_trace
from functools import wraps
from chainlit.config import config
from chainlit.version import __version__


# Patch uptrace.py to hash the hostname to avoid leaking it.
def _build_resource(
    resource: Resource,
    resource_attributes: Attributes,
    service_name: str,
    service_version: str,
    deployment_environment: str,
) -> Resource:
    if resource:
        return resource

    # If we are in production, use the URL as hostname
    if config.chainlit_prod_url:
        host_name = config.chainlit_prod_url
    # Hash the local hostname to avoid leaking it.
    else:
        host_name = gethostname()
        host_name = hashlib.sha256(host_name.encode("UTF-8")).hexdigest()

    attrs = {"host.name": host_name}

    if resource_attributes:
        attrs.update(resource_attributes)
    if service_name:
        attrs["service.name"] = service_name
    if service_version:
        attrs["service.version"] = service_version
    if deployment_environment:
        attrs["deployment.environment"] = deployment_environment

    return Resource.create(attrs)


uptrace.uptrace._build_resource = _build_resource

uptrace.configure_opentelemetry(
    dsn="https://YPa4AbDF853uCW6UWN2oYg@api.uptrace.dev/1778",
    service_name="chainlit",
    service_version="1.0.0",
    deployment_environment="production",
)

tracer = ot_trace.get_tracer("chainlit", __version__)


def trace_event(event_name):
    if config.enable_telemetry:
        with tracer.start_as_current_span(
            event_name, record_exception=False, set_status_on_exception=False
        ):
            return


def trace(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        event_name = func.__name__
        if config.enable_telemetry:
            with tracer.start_as_current_span(
                event_name, record_exception=False, set_status_on_exception=False
            ):
                return func(*args, **kwargs)
        else:
            return func(*args, **kwargs)

    return wrapper
