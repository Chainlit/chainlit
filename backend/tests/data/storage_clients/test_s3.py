import os

import boto3  # type: ignore
import pytest
from moto import mock_aws

from chainlit.data.storage_clients.s3 import S3StorageClient


# Fixtures for setting up the DynamoDB table
@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture
def s3_mock(aws_credentials):
    """Moto mock S3 setup."""
    with mock_aws():
        s3 = boto3.client("s3", region_name="us-east-1")
        # Create a mock bucket
        s3.create_bucket(Bucket="my-test-bucket")
        yield s3


@pytest.mark.asyncio
async def test_upload_file(s3_mock):
    # Initialize the S3StorageClient with the mock bucket
    client = S3StorageClient(bucket="my-test-bucket")

    # Call the upload_file method and await the result
    result = await client.upload_file(
        object_key="test.txt", data="This is a test file", mime="text/plain"
    )

    # Assert that the file upload returned the correct URL
    assert result["object_key"] == "test.txt"
    assert result["url"] == "https://my-test-bucket.s3.amazonaws.com/test.txt"

    # Verify that the file exists in the mock S3
    response = s3_mock.get_object(Bucket="my-test-bucket", Key="test.txt")
    assert response["Body"].read().decode() == "This is a test file"
