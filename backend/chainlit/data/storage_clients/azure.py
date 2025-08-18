from typing import TYPE_CHECKING, Any, Dict, Optional, Union

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
            logger.warning(f"AzureStorageClient initialization error: {e}")

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
        content_disposition: str | None = None,
    ) -> Dict[str, Any]:
        try:
            file_client: DataLakeFileClient = self.container_client.get_file_client(
                object_key
            )
            content_settings = ContentSettings(
                content_type=mime, content_disposition=content_disposition
            )
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
            logger.warning(f"AzureStorageClient, upload_file error: {e}")
            return {}
