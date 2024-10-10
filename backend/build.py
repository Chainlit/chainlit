"""Build scritp gets called on poetry build."""

import pathlib
import shutil
import subprocess


def pnpm_install(project_root):
    subprocess.run(["pnpm", "install"], cwd=project_root)


def pnpm_buildui(project_root):
    subprocess.run(["pnpm", "buildUi"], cwd=project_root)


def copy_frontend(project_root):
    """Copy the frontend dist directory to the backend for inclusion in the package."""

    # Create backend frontend dist dir
    backend_frontend_dir = project_root / "backend" / "chainlit" / "frontend"
    backend_frontend_dir.mkdir(parents=True, exist_ok=True)

    # Recursively copy frontend_dist to backend_frontend_dir
    frontend_dist = project_root / "frontend" / "dist"

    shutil.copytree(frontend_dist, backend_frontend_dir / "dist", dirs_exist_ok=True)


def copy_copilot(project_root):
    """Copy the copilot dist directory to the backend for inclusion in the package."""

    # Create backend copilot dir
    backend_copilot_dir = project_root / "backend" / "chainlit" / "copilot"
    backend_copilot_dir.mkdir(parents=True, exist_ok=True)

    # Recursively copy copilot_dist to backend_copilot_dir
    copilot_dist = project_root / "libs" / "copilot" / "dist"

    shutil.copytree(copilot_dist, backend_copilot_dir / "dist", dirs_exist_ok=True)


if __name__ == "__main__":
    project_root = pathlib.Path.cwd().parent
    pnpm_install(project_root)
    pnpm_buildui(project_root)
    copy_frontend(project_root)
    copy_copilot(project_root)
