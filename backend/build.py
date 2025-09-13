"""Build script gets called on uv/pip build."""

import pathlib
import shutil
import subprocess
import sys

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class BuildError(Exception):
    """Custom exception for build failures"""

    pass


def run_subprocess(cmd: list[str], cwd: pathlib.Path) -> None:
    """
    Run a subprocess, allowing natural signal propagation.

    Args:
        cmd: Command and arguments as a list of strings
        cwd: Working directory for the subprocess
    """

    print(f"-- Running: {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)


def pnpm_install(project_root: pathlib.Path, pnpm_path: str):
    run_subprocess([pnpm_path, "install", "--frozen-lockfile"], project_root)


def pnpm_buildui(project_root: pathlib.Path, pnpm_path: str):
    run_subprocess([pnpm_path, "buildUi"], project_root)


def copy_directory(src: pathlib.Path, dst: pathlib.Path, description: str):
    """Copy directory with proper error handling"""
    print(f"Copying {description} from {src} to {dst}")
    try:
        if dst.exists():
            shutil.rmtree(dst)
        dst.mkdir(parents=True)
        shutil.copytree(src, dst, dirs_exist_ok=True)
    except KeyboardInterrupt:
        print("\nInterrupt received during copy operation...")
        # Clean up partial copies
        if dst.exists():
            shutil.rmtree(dst)
        raise
    except Exception as e:
        raise BuildError(f"Failed to copy {src} to {dst}: {e!s}")


def copy_frontend(project_root: pathlib.Path):
    """Copy the frontend dist directory to the backend for inclusion in the package."""
    backend_frontend_dir = project_root / "backend" / "chainlit" / "frontend" / "dist"
    frontend_dist = project_root / "frontend" / "dist"
    copy_directory(frontend_dist, backend_frontend_dir, "frontend assets")


def copy_copilot(project_root: pathlib.Path):
    """Copy the copilot dist directory to the backend for inclusion in the package."""
    backend_copilot_dir = project_root / "backend" / "chainlit" / "copilot" / "dist"
    copilot_dist = project_root / "libs" / "copilot" / "dist"
    copy_directory(copilot_dist, backend_copilot_dir, "copilot assets")


def build():
    """Main build function with proper error handling"""

    print(
        "\n-- Building frontend, this might take a while!\n\n"
        "   If you don't need to build the frontend and just want dependencies installed, use:\n"
        "   `uv sync --no-install-project --no-editable`\n"
    )

    try:
        # Find directory containing this file
        backend_dir = pathlib.Path(__file__).resolve().parent
        project_root = backend_dir.parent

        # Dirty hack to distinguish between building wheel from sdist and from source code
        if not (project_root / "package.json").exists():
            return

        pnpm = shutil.which("pnpm")
        if not pnpm:
            raise BuildError("pnpm not found!")

        pnpm_install(project_root, pnpm)
        pnpm_buildui(project_root, pnpm)
        copy_frontend(project_root)
        copy_copilot(project_root)

    except KeyboardInterrupt:
        print("\nBuild interrupted by user")
        sys.exit(1)
    except BuildError as e:
        print(f"\nBuild failed: {e!s}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e!s}")
        sys.exit(1)


class CustomBuildHook(BuildHookInterface):
    def initialize(self, _, __):
        build()
