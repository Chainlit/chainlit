import os
from typing import Any, Dict, Union

import boto3  # type: ignore

from chainlit import make_async
from chainlit.data.storage_clients.base import BaseStorageClient, storage_expiry_time
from chainlit.logger import logger


class S3StorageClient(BaseStorageClient):
    """
    Class to enable Amazon S3 storage provider
    """

    def __init__(self, bucket: str, **kwargs: Any):
        try:
            self.bucket = bucket
            self.client = boto3.client("s3", **kwargs)
            logger.info("S3StorageClient initialized")
        except Exception as e:
            logger.warning(f"S3StorageClient initialization error: {e}")

    def sync_get_read_url(self, object_key: str) -> str:
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": object_key},
                ExpiresIn=storage_expiry_time,
            )
            return url
        except Exception as e:
            logger.warning(f"S3StorageClient, get_read_url error: {e}")
            return object_key

    async def get_read_url(self, object_key: str) -> str:
        return await make_async(self.sync_get_read_url)(object_key)

    def sync_upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
        content_disposition: str | None = None,
    ) -> Dict[str, Any]:
        try:
            if content_disposition is not None:
                self.client.put_object(
                    Bucket=self.bucket,
                    Key=object_key,
                    Body=data,
                    ContentType=mime,
                    ContentDisposition=content_disposition,
                )
            else:
                self.client.put_object(
                    Bucket=self.bucket, Key=object_key, Body=data, ContentType=mime
                )
            endpoint = os.environ.get("DEV_AWS_ENDPOINT", "amazonaws.com")
            url = f"https://{self.bucket}.s3.{endpoint}/{object_key}"
            return {"object_key": object_key, "url": url}
        except Exception as e:
            logger.warning(f"S3StorageClient, upload_file error: {e}")
            return {}

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
        content_disposition: str | None = None,
    ) -> Dict[str, Any]:
        return await make_async(self.sync_upload_file)(
            object_key, data, mime, overwrite, content_disposition
        )

    def sync_delete_file(self, object_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket, Key=object_key)
            return True
        except Exception as e:
            logger.warning(f"S3StorageClient, delete_file error: {e}")
            return False

    async def delete_file(self, object_key: str) -> bool:
        return await make_async(self.sync_delete_file)(object_key)
