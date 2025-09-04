import mimetypes
import shutil
from pathlib import Path
from typing import Any, Dict, Optional, Union
from urllib.request import pathname2url

from chainlit import make_async
from chainlit.data.storage_clients.base import BaseStorageClient
from chainlit.logger import logger


class LocalStorageClient(BaseStorageClient):
    """
    Class to enable local file system storage provider
    """

    def __init__(self, storage_path: str, base_url: Optional[str] = None):
        try:
            self.storage_path = Path(storage_path).resolve()
            # For local storage, we'll use the backend's storage route
            # base_url is kept for compatibility but not used for read URLs
            self.base_url = base_url or ""
            
            # Create storage directory if it doesn't exist
            self.storage_path.mkdir(parents=True, exist_ok=True)

            logger.info(f"LocalStorageClient initialized with path: {self.storage_path}")
        except Exception as e:
            logger.warning(f"LocalStorageClient initialization error: {e}")
            raise

    def _validate_object_key(self, object_key: str) -> Path:
        """
        Validate object_key and ensure the resolved path is within storage directory.
        
        Args:
            object_key: The object key to validate
            
        Returns:
            Resolved Path object within storage directory
            
        Raises:
            ValueError: If path traversal is detected or path is invalid
        """
        try:
            # Reject absolute paths immediately
            if object_key.startswith("/"):
                logger.warning(f"Absolute path rejected: {object_key}")
                raise ValueError("Invalid object key: absolute paths not allowed")
            
            # Normalize object_key and check for traversal patterns
            normalized_key = object_key.strip()
            if ".." in normalized_key or "\\" in normalized_key:
                logger.warning(f"Path traversal patterns detected: {object_key}")
                raise ValueError("Invalid object key: path traversal detected")
            
            # Create the file path
            file_path = self.storage_path / normalized_key
            resolved_path = file_path.resolve()
            
            # Ensure the resolved path is within the storage directory
            resolved_path.relative_to(self.storage_path)
            
            return resolved_path
        except ValueError as e:
            # Re-raise ValueError as is (our custom errors)
            raise e
        except Exception as e:
            logger.warning(f"Path validation error for {object_key}: {e}")
            raise ValueError(f"Invalid object key: {e}")

    def sync_get_read_url(self, object_key: str) -> str:
        try:
            file_path = self._validate_object_key(object_key)
            if file_path.exists():
                # Return URL pointing to the backend's storage route
                url_path = pathname2url(object_key)
                return f"/storage/file/{url_path}"
            else:
                logger.warning(f"LocalStorageClient: File not found: {object_key}")
                return object_key
        except ValueError:
            # Path validation failed, return object_key as fallback
            return object_key
        except Exception as e:
            logger.warning(f"LocalStorageClient, get_read_url error: {e}")
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
            file_path = self._validate_object_key(object_key)
            
            # Create parent directories if they don't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Check if file exists and overwrite is False
            if file_path.exists() and not overwrite:
                logger.warning(f"LocalStorageClient: File exists and overwrite=False: {object_key}")
                return {}
            
            # Write data to file
            if isinstance(data, str):
                file_path.write_text(data, encoding="utf-8")
            else:
                file_path.write_bytes(data)
            
            # Generate URL for the uploaded file
            relative_path = file_path.relative_to(self.storage_path)
            url_path = pathname2url(str(relative_path))
            url = f"{self.base_url}/files/{url_path}"
            
            return {"object_key": object_key, "url": url}
        except ValueError as e:
            logger.warning(f"LocalStorageClient, upload_file error: {e}")
            return {}
        except Exception as e:
            logger.warning(f"LocalStorageClient, upload_file error: {e}")
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
            file_path = self._validate_object_key(object_key)
            if file_path.exists():
                if file_path.is_file():
                    file_path.unlink()
                elif file_path.is_dir():
                    shutil.rmtree(file_path)
                return True
            else:
                logger.warning(f"LocalStorageClient: File not found for deletion: {object_key}")
                return False
        except ValueError as e:
            logger.warning(f"LocalStorageClient, delete_file error: {e}")
            return False
        except Exception as e:
            logger.warning(f"LocalStorageClient, delete_file error: {e}")
            return False

    async def delete_file(self, object_key: str) -> bool:
        return await make_async(self.sync_delete_file)(object_key)

    def sync_download_file(self, object_key: str) -> tuple[bytes, str] | None:
        try:
            file_path = self._validate_object_key(object_key)
            if not file_path.exists() or not file_path.is_file():
                logger.warning(f"LocalStorageClient: File not found for download: {object_key}")
                return None
            
            # Get MIME type
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if not mime_type:
                mime_type = "application/octet-stream"
            
            # Read file content
            content = file_path.read_bytes()
            return (content, mime_type)
        except ValueError as e:
            logger.warning(f"LocalStorageClient, download_file error: {e}")
            return None
        except Exception as e:
            logger.warning(f"LocalStorageClient, download_file error: {e}")
            return None

    async def download_file(self, object_key: str) -> tuple[bytes, str] | None:
        return await make_async(self.sync_download_file)(object_key)