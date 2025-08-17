import boto3
import tempfile
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class S3FileDownloader:
    """Utility class for downloading files from S3 for agent processing"""

    def __init__(self):
        """Initialize S3 client with credentials from environment"""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('APP_AWS_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('APP_AWS_SECRET_KEY'),
            region_name=os.getenv('APP_AWS_REGION', 'eu-north-1')
        )
        self.bucket_name = os.getenv('BUCKET_NAME', 'keystone-user-content-files')

    def download_s3_file(self, s3_key: str, s3_bucket: Optional[str] = None, local_filename: Optional[str] = None) -> str:
        """
        Download a file from S3 to local temporary storage

        Args:
            s3_key: S3 object key
            s3_bucket: S3 bucket name (optional, uses default if not provided)
            local_filename: Local filename (optional, will generate temp file if not provided)
            
        Returns:
            str: Path to downloaded local file
        """
        bucket = s3_bucket or self.bucket_name

        try:
            # Create temporary file if no local filename provided
            if local_filename is None:
                # Extract original extension from S3 key
                file_extension = Path(s3_key).suffix
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
                local_path = temp_file.name
                temp_file.close()
            else:
                local_path = local_filename

            # Download file from S3
            self.s3_client.download_file(bucket, s3_key, local_path)

            print(f"Successfully downloaded {s3_key} from {bucket} to {local_path}")
            return local_path

        except Exception as e:
            print(f"Failed to download {s3_key} from S3: {e}")
            raise

    def cleanup_temp_file(self, file_path: str):
        """Clean up temporary downloaded file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                print(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            print(f"Failed to clean up temporary file {file_path}: {e}")


def download_s3_file_for_processing(message_content) -> Optional[str]:
    """
    Convenience function to download S3 file from message content
    
    Args:
        message_content: Message content that may contain S3 file reference
        
    Returns:
        str: Path to downloaded local file or None if no S3 file found
    """
    downloader = S3FileDownloader()

    if isinstance(message_content, list):
        for item in message_content:
            if (isinstance(item, dict) and
                item.get('source_type') == 's3' and
                's3_key' in item):
                return downloader.download_s3_file(
                    s3_key=item['s3_key'],
                    s3_bucket=item.get('s3_bucket')
                )

    return None


def is_s3_file_reference(message_content) -> bool:
    """
    Check if message content contains an S3 file reference

    Args:
        message_content: Message content to check

    Returns:
        bool: True if content contains S3 file reference
    """
    # Check for S3 content block indicators
    if isinstance(message_content, list):
        for item in message_content:
            if (isinstance(item, dict) and
                item.get('source_type') == 's3' and
                's3_key' in item):
                return True
    return False

