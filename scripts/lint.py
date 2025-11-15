#!/usr/bin/env -S uv run
"""Test runner script for the project."""

import subprocess
import sys


def main():
    """Run pytest on the test suite."""
    cmd = ["ruff", "check"] + sys.argv[1:]
    result = subprocess.run(cmd)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
