import os
from typing import Optional

from chainlit.config import config
from chainlit.data.base import BaseDataLayer
from chainlit.data.chainlit import ChainlitDataLayer
from chainlit.data.mongodb import MongoDBDataLayer


_data_layer: Optional[BaseDataLayer] = None

if config.data_layer.database == "chainlit":
    api_key = os.environ.get("LITERAL_API_KEY")
    assert api_key is not None
    server = os.environ.get("LITERAL_SERVER")
    _data_layer = ChainlitDataLayer(api_key=api_key, server=server)
if config.data_layer.database == "mongodb":
    if config.data_layer.object_storage != "s3":
        raise ValueError("MongoDB data layer requires an S3 object storage")
    db_url = os.environ.get("CHAINLIT_MONGODB_URL")
    _data_layer = MongoDBDataLayer(db_url)


def get_data_layer():
    return _data_layer
