from typing import TYPE_CHECKING, Any, Dict, Optional, Union

from azure.storage.blob.aio import BlobServiceClient as AsyncBlobServiceClient
from azure.storage.filedatalake import (
    ContentSettings,
    DataLakeFileClient,
    DataLakeServiceClient,
    FileSystemClient,
)

from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.logger import logger

if TYPE_CHECKING:
    from azure.core.credentials import (
        AzureNamedKeyCredential,
        AzureSasCredential,
        TokenCredential,
    )


class AzureStorageClient(BaseStorageClient):
    """
    Class to enable Azure Data Lake Storage (ADLS) Gen2

    parms:
        account_url: "https://<your_account>.dfs.core.windows.net"
        credential: Access credential (AzureKeyCredential)
        sas_token: Optionally include SAS token to append to urls
    """

    def __init__(
        self,
        account_url: str,
        container: str,
        credential: Optional[
            Union[
                str,
                Dict[str, str],
                "AzureNamedKeyCredential",
                "AzureSasCredential",
                "TokenCredential",
            ]
        ],
        sas_token: Optional[str] = None,
    ):
        try:
            self.data_lake_client = DataLakeServiceClient(
                account_url=account_url, credential=credential
            )
            self.container_client: FileSystemClient = (
                self.data_lake_client.get_file_system_client(file_system=container)
            )
            self.sas_token = sas_token
            logger.info("AzureStorageClient initialized")
        except Exception as e:
            logger.warn(f"AzureStorageClient initialization error: {e}")

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        try:
            file_client: DataLakeFileClient = self.container_client.get_file_client(
                object_key
            )
            content_settings = ContentSettings(content_type=mime)
            file_client.upload_data(
                data, overwrite=overwrite, content_settings=content_settings
            )
            url = (
                f"{file_client.url}{self.sas_token}"
                if self.sas_token
                else file_client.url
            )
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warn(f"AzureStorageClient, upload_file error: {e}")
            return {}


class AzureBlobStorageClient(BaseStorageClient):
    def __init__(self, container_name: str, storage_account: str, storage_key: str):
        self.container_name = container_name
        connection_string = (
            f"DefaultEndpointsProtocol=https;"
            f"AccountName={storage_account};"
            f"AccountKey={storage_key};"
            f"EndpointSuffix=core.windows.net"
        )
        self.service_client = AsyncBlobServiceClient.from_connection_string(
            connection_string
        )

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

            await blob_client.upload_blob(
                data, overwrite=overwrite, content_settings={"content_type": mime}
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
