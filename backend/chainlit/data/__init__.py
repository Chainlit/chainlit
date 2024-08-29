import os
from typing import TYPE_CHECKING, Optional

from chainlit.data.literalai import ChainlitDataLayer

if TYPE_CHECKING:
    from chainlit.data.base import BaseDataLayer


_data_layer: Optional[BaseDataLayer] = None


if api_key := os.environ.get("LITERAL_API_KEY"):
    # support legacy LITERAL_SERVER variable as fallback
    server = os.environ.get("LITERAL_API_URL") or os.environ.get("LITERAL_SERVER")
    _data_layer = ChainlitDataLayer(api_key=api_key, server=server)


def get_data_layer():
    return _data_layer
