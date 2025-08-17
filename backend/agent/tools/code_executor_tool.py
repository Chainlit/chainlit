from langchain.tools import tool
import docker
import tempfile
import os
import pathlib

import requests

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
    vtp_file_name = vtp_files[0]
    vtp_file_path = os.path.join(output_dir, vtp_file_name)

    os.unlink(temp_file)

    with open(vtp_file_path, 'rb') as f:
        files = {'file': (vtp_file_name, f, 'application/octet-stream')}
        response = requests.post(os.getenv('BACKEND_HOST')+'/upload', files=files)
        upload_data = response.json()
        s3_key = upload_data.get("s3_key")
        print(f"/files/by-key/{s3_key}")

        return f"/files/by-key/{s3_key}"

