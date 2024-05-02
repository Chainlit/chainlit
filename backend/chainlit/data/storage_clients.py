from chainlit.data import BaseStorageClient
from chainlit.logger import logger
from typing import TYPE_CHECKING, Optional, Dict, Union, Any
from azure.storage.filedatalake import DataLakeServiceClient, FileSystemClient, DataLakeFileClient, ContentSettings
import boto3    # type: ignore
from google.cloud import storage

if TYPE_CHECKING:
    from azure.core.credentials import AzureNamedKeyCredential, AzureSasCredential, TokenCredential

class AzureStorageClient(BaseStorageClient):
    """
    Class to enable Azure Data Lake Storage (ADLS) Gen2

    parms:
        account_url: "https://<your_account>.dfs.core.windows.net"
        credential: Access credential (AzureKeyCredential)
        sas_token: Optionally include SAS token to append to urls
    """
    def __init__(self, account_url: str, container: str, credential: Optional[Union[str, Dict[str, str], "AzureNamedKeyCredential", "AzureSasCredential", "TokenCredential"]], sas_token: Optional[str] = None):
        try:
            self.data_lake_client = DataLakeServiceClient(account_url=account_url, credential=credential)
            self.container_client: FileSystemClient = self.data_lake_client.get_file_system_client(file_system=container)
            self.sas_token = sas_token
            logger.info("AzureStorageClient initialized")
        except Exception as e:
            logger.warn(f"AzureStorageClient initialization error: {e}")
        
    async def upload_file(self, object_key: str, data: Union[bytes, str], mime: str = 'application/octet-stream', overwrite: bool = True) -> Dict[str, Any]:
        try:
            file_client: DataLakeFileClient = self.container_client.get_file_client(object_key)
            content_settings = ContentSettings(content_type=mime)
            file_client.upload_data(data, overwrite=overwrite, content_settings=content_settings)
            url = f"{file_client.url}{self.sas_token}" if self.sas_token else file_client.url
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warn(f"AzureStorageClient, upload_file error: {e}")
            return {}

class S3StorageClient(BaseStorageClient):
    """
    Class to enable Amazon S3 storage provider

    params:
        bucket: Name of the S3 bucket
        access_key: AWS access key
        secret_key: AWS secret key
        session_token: AWS session token
    """
    def __init__(self, bucket: str, access_key: Optional[str] = None, secret_key: Optional[str] = None, session_token: Optional[str] = None):
        try:
            self.bucket = bucket
            if access_key and secret_key and session_token:
                self.client = boto3.client("s3", aws_access_key_id=access_key, aws_secret_access_key=secret_key, aws_session_token=session_token)
            else:
                self.client = boto3.client("s3")
            logger.info("S3StorageClient initialized")
        except Exception as e:
            logger.warn(f"S3StorageClient initialization error: {e}")

    async def upload_file(self, object_key: str, data: Union[bytes, str], mime: str = 'application/octet-stream', **kwargs) -> Dict[str, Any]:
        """
        Upload file to S3 bucket
        
        params:
            object_key: Key to store the object in the bucket
            data: Data to be stored
            mime: Mime type of the object"""
        try:
            self.client.put_object(Bucket=self.bucket, Key=object_key, Body=data, ContentType=mime)
            url = f"https://{self.bucket}.s3.amazonaws.com/{object_key}"
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warn(f"S3StorageClient, upload_file error: {e}")
            return {}
        
class GoogleCloudClient(BaseStorageClient):
    """
    Class to enable Google Cloud Storage

    params:
        bucket: Name of the GCS bucket
    """
    def __init__(self, bucket: str):
        try:
            self.client = storage.Client()
            self.bucket = self.client.bucket(bucket)
            logger.info("GoogleCloudClient initialized")
        except Exception as e:
            logger.warn(f"GoogleCloudClient initialization error: {e}")

    async def upload_file(self, object_key: str, data: Union[bytes, str], mime: str = 'application/octet-stream', **kwargs) -> Dict[str, Any]:
        """
        Upload file to GCS bucket
        
        params:
            object_key: Key to store the object in the bucket
            data: Data to be stored
            mime: Mime type of the object"""
        try:
            blob = self.bucket.blob(object_key)
            blob.upload_from_string(data, content_type=mime)
            url = f"https://storage.googleapis.com/{self.bucket.name}/{object_key}"
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warn(f"GoogleCloudClient, upload_file error: {e}")
            return {}