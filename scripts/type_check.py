#!/usr/bin/env -S uv run
"""Type-checking script for the project."""

import subprocess
import sys


def main():
    """Run mypy on the backend package."""
    cmd = ["mypy", "backend/"] + sys.argv[1:]
    result = subprocess.run(cmd)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
