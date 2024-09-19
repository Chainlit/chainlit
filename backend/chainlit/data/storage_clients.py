from typing import TYPE_CHECKING, Any, Dict, Optional, Union

import boto3  # type: ignore
from azure.storage.filedatalake import (
    ContentSettings,
    DataLakeFileClient,
    DataLakeServiceClient,
    FileSystemClient,
)
from chainlit.data.base import BaseStorageClient
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


class S3StorageClient(BaseStorageClient):
    """
    Class to enable Amazon S3 storage provider
    """

    def __init__(self, bucket: str):
        try:
            self.bucket = bucket
            self.client = boto3.client("s3")
            logger.info("S3StorageClient initialized")
        except Exception as e:
            logger.warn(f"S3StorageClient initialization error: {e}")

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        try:
            self.client.put_object(
                Bucket=self.bucket, Key=object_key, Body=data, ContentType=mime
            )
            url = f"https://{self.bucket}.s3.amazonaws.com/{object_key}"
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warn(f"S3StorageClient, upload_file error: {e}")
            return {}
