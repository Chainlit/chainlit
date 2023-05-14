import os
import tarfile
import fnmatch
import tempfile
import requests
from chainlit.cli.utils import check_file
from chainlit.config import config
from chainlit.cli.auth import get_access_token


def get_gitignore_patterns():
    patterns = []
    if not os.path.exists(".gitignore"):
        return patterns

    with open(".gitignore", "r", encoding="utf-8") as gitignore_file:
        for line in gitignore_file:
            line = line.strip()
            if line and not line.startswith("#"):
                patterns.append(line)

    return patterns


def is_excluded(file_path, patterns):
    for pattern in patterns:
        if fnmatch.fnmatch(file_path, pattern):
            return True
    return False


def create_tar_gz_archive(archive_path, source_dir):
    gitignore_patterns = get_gitignore_patterns()
    with tarfile.open(archive_path, "w:gz") as tar_file:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                if not is_excluded(file_path, gitignore_patterns):
                    tar_file.add(
                        file_path, arcname=os.path.relpath(file_path, source_dir)
                    )


def upload_tar_gz_archive(access_token: str, archive_path: str):
    url = f"{config.chainlit_server}/api/upload/deployment"
    body = {"projectId": config.project_id}

    headers = {"Authorization": access_token}

    res = requests.post(url, json=body, headers=headers)

    if not res.ok:
        raise Exception(f"Failed to upload archive: {res.text}")

    json_res = res.json()

    upload_details = json_res["post"]
    permanent_url = json_res["permanentUrl"]

    files = {"file": open(archive_path, "rb")}

    upload_response = requests.post(
        upload_details["url"], data=upload_details["fields"], files=files
    )

    if not upload_response.ok:
        raise Exception(f"Failed to upload archive: {res.text}")

    url = f'{upload_details["url"]}/{upload_details["fields"]["key"]}'
    return permanent_url, url


def deploy(target: str):
    if not config.project_id:
        raise Exception(
            "Project id not set in config. A project id is mandatory to deploy a chainlit app."
        )

    check_file(target)

    access_token = get_access_token()

    with tempfile.TemporaryDirectory() as tempdir:
        archive_path = os.path.join(tempdir, "chainlit.tar.gz")
        source_dir = os.getcwd()
        create_tar_gz_archive(archive_path, source_dir)
        permanent_url, url = upload_tar_gz_archive(access_token, archive_path)
