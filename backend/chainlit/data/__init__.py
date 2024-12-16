import os
from typing import Optional

from .base import BaseDataLayer
from .utils import (
    queue_until_user_message as queue_until_user_message,  # TODO: Consider deprecating re-export.; Redundant alias tells type checkers to STFU.
)

_data_layer: Optional[BaseDataLayer] = None
_data_layer_initialized = False


def get_data_layer():
    global _data_layer, _data_layer_initialized

    if not _data_layer_initialized:
        if _data_layer:
            # Data layer manually set, warn user that this is deprecated.
            import warnings

            warnings.warn(
                "Setting data layer manually is deprecated. Use @data_layer instead.",
                DeprecationWarning,
            )

        else:
            from chainlit.config import config

            if config.code.data_layer:
                # When @data_layer is configured, call it to get data layer.
                _data_layer = config.code.data_layer()
            elif api_key := os.environ.get("LITERAL_API_KEY"):
                # When LITERAL_API_KEY is defined, use Literal AI data layer
                from .literalai import LiteralDataLayer

                if os.environ.get("DATABASE_URL"):
                    warnings.warn(
                        "Both LITERAL_API_KEY and DATABASE_URL specified. Relying on Literal AI data layer."
                    )
                # support legacy LITERAL_SERVER variable as fallback
                server = os.environ.get("LITERAL_API_URL") or os.environ.get(
                    "LITERAL_SERVER"
                )
                _data_layer = LiteralDataLayer(api_key=api_key, server=server)
            elif database_url := os.environ.get("DATABASE_URL"):
                # Default to Chainlit data layer if DATABASE_URL specified.
                from .chainlit_data_layer import ChainlitDataLayer

                _data_layer = ChainlitDataLayer(database_url=database_url)

        _data_layer_initialized = True

    return _data_layer
