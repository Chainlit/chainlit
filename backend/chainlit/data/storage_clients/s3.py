from typing import Any, Dict, Union

import boto3  # type: ignore

from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.logger import logger


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
