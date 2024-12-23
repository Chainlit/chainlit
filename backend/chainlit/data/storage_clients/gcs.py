import base64
from typing import Any, Dict, Union

from google.cloud import storage  # type: ignore
from google.oauth2 import service_account

from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.logger import logger


class GCSStorageClient(BaseStorageClient):
    def __init__(
        self, project_id: str, client_email: str, private_key: str, bucket_name: str
    ):
        private_key = base64.b64decode(private_key).decode("utf-8")

        credentials = service_account.Credentials.from_service_account_info(
            {
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )

        self.client = storage.Client(project=project_id, credentials=credentials)
        self.bucket_name = bucket_name
        self.bucket = self.client.bucket(bucket_name)
        logger.info("GCSStorageClient initialized")

    async def upload_file(
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

            return {
                "object_key": object_key,
                "url": f"gs://{self.bucket_name}/{object_key}",
            }

        except Exception as e:
            raise Exception(f"Failed to upload file to GCS: {e!s}")
