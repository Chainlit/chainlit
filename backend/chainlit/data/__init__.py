import os
from typing import Optional

from chainlit.client.cloud import ChainlitCloudClient
from chainlit.config import config

chainlit_client = None  # type: Optional[ChainlitCloudClient]

if config.data_persistence:
    chainlit_client = ChainlitCloudClient(
        api_key=os.environ.get("CHAINLIT_API_KEY", ""),
        chainlit_server=config.chainlit_server,
    )
