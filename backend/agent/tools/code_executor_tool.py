from langchain.tools import tool
import docker
import tempfile
import os
import pathlib
import uuid
from datetime import datetime
from chainlit.data.storage_clients.s3 import S3StorageClient


@tool
def code_executor_tool(code: str) -> str:
    """
    Execute FreeCAD code in Docker container.

    Args:
        code: FreeCAD Python code to execute
        
    Returns:
        str: Execution results
    """
    # Clean the code by removing markdown code blocks
    cleaned_code = code.strip()
    if cleaned_code.startswith('```python'):
        cleaned_code = cleaned_code[9:]  # Remove ```python
    if cleaned_code.startswith('```'):
        cleaned_code = cleaned_code[3:]   # Remove ```
    if cleaned_code.endswith('```'):
        cleaned_code = cleaned_code[:-3]  # Remove closing ```
    cleaned_code = cleaned_code.strip()

    # Create temporary file in /tmp for Docker access
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='/tmp') as f:
        f.write(cleaned_code)
        temp_file = pathlib.Path(f.name)

    # Initialize Docker client
    client = docker.from_env()
    output_dir = tempfile.mkdtemp(dir="/tmp")

    # Run the FreeCAD code in Docker container
    # Maps /tmp to /out and frontend/public to /output
    container = client.containers.create(
        image="ghcr.io/bloomcore/freecad:latest",
        command=[
            "python3",
            f"/out/{temp_file.name}"
        ],
        volumes={
            "/tmp": {"bind": "/out", "mode": "rw"},
            f"{output_dir}": {"bind": "/output", "mode": "rw"}
        },
        user=f"{os.getuid()}:{os.getgid()}",
        detach=True
    )
    container.start()

    # This will raise docker.errors.Timeout if it takes longer than 30 sec
    container.wait(timeout=30)
    container.remove()

    vtp_files = [f for f in os.listdir(output_dir) if f.endswith('.vtp')]
    if not vtp_files:
        return "Error: No .vtp file generated."

    vtp_file_name = vtp_files[0]
    vtp_file_path = os.path.join(output_dir, vtp_file_name)

    os.unlink(temp_file)

    # S3 configuration
    AWS_REGION = os.getenv("APP_AWS_REGION", "eu-north-1")
    AWS_ACCESS_KEY = os.getenv("APP_AWS_ACCESS_KEY")
    AWS_SECRET_KEY = os.getenv("APP_AWS_SECRET_KEY")
    BUCKET_NAME = os.getenv("BUCKET_NAME", "keystone-user-content-files")

    if not all([AWS_ACCESS_KEY, AWS_SECRET_KEY, BUCKET_NAME]):
        return "Error: Missing AWS configuration for file upload."

    storage_client = S3StorageClient(
        bucket=BUCKET_NAME,
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
    )

    with open(vtp_file_path, 'rb') as f:
        vtp_file_content = f.read()

    file_extension = vtp_file_name.lower().split(".")[-1]
    unique_id = str(uuid.uuid4())
    year = datetime.now().year
    month = datetime.now().strftime("%m")

    s3_key = f"user-uploads/{year}/{month}/{unique_id}.{file_extension}"

    upload_data = storage_client.sync_upload_file(
        object_key=s3_key,
        data=vtp_file_content,
        mime='application/octet-stream'
    )

    s3_key_from_upload = upload_data.get("object_key")
    if s3_key_from_upload:
        print(f"/files/by-key/{s3_key_from_upload}")
        return f"/files/by-key/{s3_key_from_upload}"
    else:
        return "Error: Failed to upload file to S3."

