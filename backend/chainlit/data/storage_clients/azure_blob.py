from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Union

from azure.storage.blob import BlobSasPermissions, ContentSettings, generate_blob_sas
from azure.storage.blob.aio import BlobServiceClient as AsyncBlobServiceClient

from chainlit.data.storage_clients.base import EXPIRY_TIME, BaseStorageClient
from chainlit.logger import logger


class AzureBlobStorageClient(BaseStorageClient):
    def __init__(self, container_name: str, storage_account: str, storage_key: str):
        self.container_name = container_name
        self.storage_account = storage_account
        self.storage_key = storage_key
        connection_string = (
            f"DefaultEndpointsProtocol=https;"
            f"AccountName={storage_account};"
            f"AccountKey={storage_key};"
            f"EndpointSuffix=core.windows.net"
        )
        self.service_client = AsyncBlobServiceClient.from_connection_string(
            connection_string
        )
        self.container_client = self.service_client.get_container_client(
            self.container_name
        )
        logger.info("AzureBlobStorageClient initialized")

    async def get_read_url(self, object_key: str) -> str:
        if not self.storage_key:
            raise Exception("Not using Azure Storage")

        sas_permissions = BlobSasPermissions(read=True)
        start_time = datetime.now(tz=timezone.utc)
        expiry_time = start_time + timedelta(seconds=EXPIRY_TIME)

        sas_token = generate_blob_sas(
            account_name=self.storage_account,
            container_name=self.container_name,
            blob_name=object_key,
            account_key=self.storage_key,
            permission=sas_permissions,
            start=start_time,
            expiry=expiry_time,
        )

        return f"https://{self.storage_account}.blob.core.windows.net/{self.container_name}/{object_key}?{sas_token}"

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        try:
            blob_client = self.container_client.get_blob_client(object_key)

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

    async def delete_file(self, object_key: str) -> bool:
        try:
            blob_client = self.container_client.get_blob_client(blob=object_key)
            await blob_client.delete_blob()
            return True
        except Exception as e:
            logger.warn(f"AzureBlobStorageClient, delete_file error: {e}")
            return False
