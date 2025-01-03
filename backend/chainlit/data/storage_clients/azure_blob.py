from typing import Any, Dict, Union

from azure.storage.blob import ContentSettings
from azure.storage.blob.aio import BlobServiceClient as AsyncBlobServiceClient

from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.logger import logger


class AzureBlobStorageClient(BaseStorageClient):
    def __init__(self, container_name: str, storage_account: str, storage_key: str):
        self.container_name = container_name
        connection_string = (
            f"DefaultEndpointsProtocol=https;"
            f"AccountName={storage_account};"
            f"AccountKey={storage_key};"
            f"EndpointSuffix=core.windows.net"
        )
        print("connection_string", connection_string)
        self.service_client = AsyncBlobServiceClient.from_connection_string(
            connection_string
        )
        logger.info("AzureBlobStorageClient initialized")

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        try:
            container_client = self.service_client.get_container_client(
                self.container_name
            )
            blob_client = container_client.get_blob_client(object_key)

            if isinstance(data, str):
                data = data.encode("utf-8")

            content_settings = ContentSettings(content_type=mime)

            await blob_client.upload_blob(
                data, overwrite=overwrite, content_settings=content_settings
            )

            properties = await blob_client.get_blob_properties()

            return {
                "path": object_key,
                "size": properties.size,
                "last_modified": properties.last_modified,
                "etag": properties.etag,
                "content_type": properties.content_settings.content_type,
            }

        except Exception as e:
            raise Exception(f"Failed to upload file to Azure Blob Storage: {e!s}")
