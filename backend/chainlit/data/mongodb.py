from chainlit import logger
from chainlit.data import ChainlitDataLayer
from literalai.client import LiteralClient


class MongoDataLayer(ChainlitDataLayer):
    def __init__(self, mongodb_uri: str):
        # Do not call super().__init__() here, because it will create a new LiteralClient

        from .mongodb_api import API

        self.client = LiteralClient(api_key="literalai")  # API key is unused
        self.client.api = API(mongodb_uri)  # type: ignore

        logger.info("Mongo data layer initialized")

