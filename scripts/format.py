#!/usr/bin/env -S uv run
"""Test runner script for the project."""

import subprocess
import sys


def main():
    """Runs formatting on backend."""
    cmd = ["ruff", "format"] + sys.argv[1:]
    result = subprocess.run(cmd)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
