"""Build script gets called on poetry/pip build."""

import pathlib
import shutil
import subprocess


def pnpm_install(project_root, pnpm_path):
    subprocess.run(
        [pnpm_path, "install", "--frozen-lockfile"], cwd=project_root, check=True
    )


def pnpm_buildui(project_root, pnpm_path):
    subprocess.run([pnpm_path, "buildUi"], cwd=project_root, check=True)


def copy_frontend(project_root):
    """Copy the frontend dist directory to the backend for inclusion in the package."""

    # Create backend frontend dist dir
    backend_frontend_dir = project_root / "backend" / "chainlit" / "frontend" / "dist"
    backend_frontend_dir.mkdir(parents=True, exist_ok=True)

    # Recursively copy frontend_dist to backend_frontend_dir
    frontend_dist = project_root / "frontend" / "dist"

    print(f"Copying {frontend_dist} to {backend_frontend_dir}")
    shutil.copytree(frontend_dist, backend_frontend_dir, dirs_exist_ok=True)


def copy_copilot(project_root):
    """Copy the copilot dist directory to the backend for inclusion in the package."""

    # Create backend copilot dir
    backend_copilot_dir = project_root / "backend" / "chainlit" / "copilot" / "dist"
    backend_copilot_dir.mkdir(parents=True, exist_ok=True)

    # Recursively copy copilot_dist to backend_copilot_dir
    copilot_dist = project_root / "libs" / "copilot" / "dist"

    print(f"Copying {copilot_dist} to {backend_copilot_dir}")
    shutil.copytree(copilot_dist, backend_copilot_dir, dirs_exist_ok=True)


def build():
    # Find directory containing this file.
    backend_dir = pathlib.Path(__file__).resolve().parent
    project_root = backend_dir.parent

    pnpm = shutil.which("pnpm")
    if not pnpm:
        print("pnpm not found!")
        exit(-1)

    pnpm_install(project_root, pnpm)
    pnpm_buildui(project_root, pnpm)
    copy_frontend(project_root)
    copy_copilot(project_root)


if __name__ == "__main__":
    build()
