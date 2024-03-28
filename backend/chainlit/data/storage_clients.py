from chainlit.data import BaseStorageClient
from chainlit.logger import logger
from typing import Optional, Dict
from azure.storage.filedatalake import DataLakeServiceClient, FileSystemClient, ContentSettings
from azure.core.credentials import AzureKeyCredential 
import boto3

class AzureStorageClient(BaseStorageClient):
    """
    Class to enable Azure Data Lake Storage (ADLS) Gen2

    parms:
        account_url: "https://<your_account>.dfs.core.windows.net"
        credential: Access credential (AzureKeyCredential)
        sas_token: Optionally include SAS token to append to urls
    """
    def __init__(self, account_url: str, container: str, credential: AzureKeyCredential, sas_token: Optional[str] = None):
        try:
            self.data_lake_client = DataLakeServiceClient(account_url=account_url, credential=credential)
            self.container_client: FileSystemClient = self.data_lake_client.get_file_system_client(file_system=container)
            self.sas_token = sas_token
            logger.info("AzureStorageClient initialized")
        except Exception as e:
            logger.warn(f"AzureStorageClient initialization error: {e}")
        
    async def upload_file(self, object_key: str, data: bytes, mime: str = 'application/octet-stream', overwrite: bool = True) -> Optional[Dict]:
        try:
            file_client: FileSystemClient = self.container_client.get_file_client(object_key)
            content_type = ContentSettings(content_type=mime)
            file_client.upload_data(data, overwrite=overwrite, content_settings=content_type)
            url = file_client.url + self.sas_token
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warn(f"AzureStorageClient, upload_file error: {e}")
            return None

class S3StorageClient(BaseStorageClient):
    """
    Class to enable Amazon S3 storage provider
    """
    def __init__(self, resource: str, bucket: str):
        try:
            self.bucket = bucket
            self.client = boto3.client(resource)
            logger.info("S3StorageClient initialized")
        except Exception as e:
            logger.warn(f"S3StorageClient initialization error: {e}")

    async def upload_file(self, object_key: str, data: bytes, mime: str = 'application/octet-stream', overwrite: bool = True) -> Optional[Dict]:
        try:
            self.client.put_object(Bucket=self.bucket, Key=object_key, Body=data)
            url = f"s3://{self.bucket}/{object_key}"
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warn(f"S3StorageClient, upload_file error: {e}")
            return None
