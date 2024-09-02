import warnings

warnings.warn(
    "The 'oauth_providers' module is deprecated and will be removed in a future version. "
    "Please use 'oauth' instead.",
    DeprecationWarning,
    stacklevel=2,
)

from chainlit.oauth.providers import (
    get_configured_oauth_providers,
    get_oauth_provider,
    providers,
)

__all__ = [
    "providers",
    "get_oauth_provider",
    "get_configured_oauth_providers",
]
