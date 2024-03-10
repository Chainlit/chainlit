import os
from typing import Optional

from chainlit.data.base import BaseDataLayer
from chainlit.data.chainlit import ChainlitDataLayer
from chainlit.data.mongodb import MongoDataLayer


_data_layer: Optional[BaseDataLayer] = None

if api_key := os.environ.get("LITERAL_API_KEY"):
    server = os.environ.get("LITERAL_SERVER")
    _data_layer = ChainlitDataLayer(api_key=api_key, server=server)

if mongodb_uri := os.environ.get("CHAINLIT_MONGODB_URI"):
    s3_bucket = os.environ.get("CHAINLIT_S3_BUCKET")
    assert s3_bucket is not None, "Environment variable CHAINLIT_S3_BUCKET is required"
    _data_layer = MongoDataLayer(mongodb_uri=mongodb_uri, s3_bucket=s3_bucket)


def get_data_layer():
    return _data_layer
