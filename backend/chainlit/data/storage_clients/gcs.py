from typing import Any, Dict, Optional, Union

from google.auth import default
from google.cloud import storage  # type: ignore
from google.oauth2 import service_account

from chainlit import make_async
from chainlit.data.storage_clients.base import BaseStorageClient, storage_expiry_time
from chainlit.logger import logger


class GCSStorageClient(BaseStorageClient):
    def __init__(
        self,
        bucket_name: str,
        project_id: Optional[str] = None,
        client_email: Optional[str] = None,
        private_key: Optional[str] = None,
    ):
        if client_email and private_key and project_id:
            # Go to IAM & Admin, click on Service Accounts, and generate a new JSON key
            logger.info("Using Private Key from Environment Variable")
            credentials = service_account.Credentials.from_service_account_info(
                {
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key": private_key,
                    "client_email": client_email,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            )
        else:
            # Application Default Credentials (e.g. in Google Cloud Run)
            logger.info("Using Application Default Credentials.")
            credentials, default_project_id = default()
            if not project_id:
                project_id = default_project_id

        self.client = storage.Client(project=project_id, credentials=credentials)
        self.bucket = self.client.bucket(bucket_name)
        logger.info("GCSStorageClient initialized")

    def sync_get_read_url(self, object_key: str) -> str:
        return self.bucket.blob(object_key).generate_signed_url(
            version="v4", expiration=storage_expiry_time, method="GET"
        )

    async def get_read_url(self, object_key: str) -> str:
        return await make_async(self.sync_get_read_url)(object_key)

    def sync_upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        try:
            blob = self.bucket.blob(object_key)

            if not overwrite and blob.exists():
                raise Exception(
                    f"File {object_key} already exists and overwrite is False"
                )

            if isinstance(data, str):
                data = data.encode("utf-8")

            blob.upload_from_string(data, content_type=mime)

            # Return signed URL
            return {
                "object_key": object_key,
                "url": self.sync_get_read_url(object_key),
            }

        except Exception as e:
            raise Exception(f"Failed to upload file to GCS: {e!s}")

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
        content_disposition: str | None = None,
    ) -> Dict[str, Any]:
        return await make_async(self.sync_upload_file)(
            object_key, data, mime, overwrite
        )

    def sync_delete_file(self, object_key: str) -> bool:
        try:
            self.bucket.blob(object_key).delete()
            return True
        except Exception as e:
            logger.warning(f"GCSStorageClient, delete_file error: {e}")
            return False

    async def delete_file(self, object_key: str) -> bool:
        return await make_async(self.sync_delete_file)(object_key)
