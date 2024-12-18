import base64
from typing import Any, Dict, Union

from google.cloud import storage
from google.oauth2 import service_account

from chainlit.data.storage_clients.base import BaseStorageClient


class GCSStorageClient(BaseStorageClient):
    def __init__(self, project_id: str, client_email: str, private_key: str):
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

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
    ) -> Dict[str, Any]:
        try:
            bucket_name, *blob_parts = object_key.split("/")
            blob_path = "/".join(blob_parts)

            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_path)

            if not overwrite and blob.exists():
                raise Exception(
                    f"File {object_key} already exists and overwrite is False"
                )

            if isinstance(data, str):
                data = data.encode("utf-8")

            blob.upload_from_string(data, content_type=mime)

            return {
                "bucket": bucket_name,
                "name": blob_path,
                "size": len(data),
                "contentType": mime,
                "url": f"gs://{bucket_name}/{blob_path}",
                "metadata": blob.metadata,
            }

        except Exception as e:
            raise Exception(f"Failed to upload file to GCS: {e!s}")
