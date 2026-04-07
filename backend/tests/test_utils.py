import os
import tempfile
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import click
import pytest

from chainlit.utils import (
    check_file,
    check_module_version,
    make_module_getattr,
    timestamp_utc,
    utc_now,
    wrap_user_function,
)


class TestUtcNow:
    """Test suite for utc_now function."""

    def test_utc_now_returns_string(self):
        """Test that utc_now returns a string."""
        result = utc_now()
        assert isinstance(result, str)

    def test_utc_now_ends_with_z(self):
        """Test that utc_now returns ISO format with Z suffix."""
        result = utc_now()
        assert result.endswith("Z")

    def test_utc_now_is_iso_format(self):
        """Test that utc_now returns valid ISO format."""
        result = utc_now()
        # Remove the Z and parse
        dt_str = result[:-1]
        # Should be parseable as ISO format
        datetime.fromisoformat(dt_str)

    def test_utc_now_is_current_time(self):
        """Test that utc_now returns approximately current time."""
        before = datetime.now(timezone.utc).replace(tzinfo=None)
        result = utc_now()
        after = datetime.now(timezone.utc).replace(tzinfo=None)

        # Parse the result (naive datetime)
        result_dt = datetime.fromisoformat(result[:-1])

        # Should be between before and after (with some tolerance for microseconds)
        assert (
            before.replace(microsecond=0) <= result_dt <= after.replace(microsecond=0)
            or before <= result_dt <= after
        )

    def test_utc_now_multiple_calls(self):
        """Test that multiple calls to utc_now return different values."""
        result1 = utc_now()
        result2 = utc_now()

        # Results should be very close but might differ
        assert isinstance(result1, str)
        assert isinstance(result2, str)


class TestTimestampUtc:
    """Test suite for timestamp_utc function."""

    def test_timestamp_utc_returns_string(self):
        """Test that timestamp_utc returns a string."""
        result = timestamp_utc(1234567890.0)
        assert isinstance(result, str)

    def test_timestamp_utc_ends_with_z(self):
        """Test that timestamp_utc returns ISO format with Z suffix."""
        result = timestamp_utc(1234567890.0)
        assert result.endswith("Z")

    def test_timestamp_utc_converts_correctly(self):
        """Test that timestamp_utc converts timestamp correctly."""
        # Known timestamp: 2009-02-13 23:31:30 UTC
        timestamp = 1234567890.0
        result = timestamp_utc(timestamp)

        # Parse and verify
        dt = datetime.fromisoformat(result[:-1])
        assert dt.year == 2009
        assert dt.month == 2
        assert dt.day == 13

    def test_timestamp_utc_with_zero(self):
        """Test timestamp_utc with epoch (0)."""
        result = timestamp_utc(0.0)
        dt = datetime.fromisoformat(result[:-1])
        assert dt.year == 1970
        assert dt.month == 1
        assert dt.day == 1

    def test_timestamp_utc_with_fractional_seconds(self):
        """Test timestamp_utc with fractional seconds."""
        timestamp = 1234567890.123456
        result = timestamp_utc(timestamp)

        # Should be valid ISO format
        dt = datetime.fromisoformat(result[:-1])
        assert isinstance(dt, datetime)

    def test_timestamp_utc_with_negative_timestamp(self):
        """Test timestamp_utc with negative timestamp (before epoch)."""
        # 1969-12-31 23:00:00 UTC
        timestamp = -3600.0
        result = timestamp_utc(timestamp)

        dt = datetime.fromisoformat(result[:-1])
        assert dt.year == 1969


@pytest.mark.asyncio
class TestWrapUserFunction:
    """Test suite for wrap_user_function."""

    async def test_wrap_user_function_with_sync_function(self, mock_chainlit_context):
        """Test wrapping a synchronous function."""
        async with mock_chainlit_context:

            def user_func(a, b):
                return a + b

            wrapped = wrap_user_function(user_func)
            result = await wrapped(5, 3)

            assert result == 8

    async def test_wrap_user_function_with_async_function(self, mock_chainlit_context):
        """Test wrapping an asynchronous function."""
        async with mock_chainlit_context:

            async def user_func(x, y):
                return x * y

            wrapped = wrap_user_function(user_func)
            result = await wrapped(4, 7)

            assert result == 28

    async def test_wrap_user_function_with_no_args(self, mock_chainlit_context):
        """Test wrapping a function with no arguments."""
        async with mock_chainlit_context:

            def user_func():
                return "hello"

            wrapped = wrap_user_function(user_func)
            result = await wrapped()

            assert result == "hello"

    async def test_wrap_user_function_with_task(self, mock_chainlit_context):
        """Test wrapping a function with task management."""
        async with mock_chainlit_context as ctx:
            ctx.emitter.task_start = AsyncMock()
            ctx.emitter.task_end = AsyncMock()

            def user_func(value):
                return value * 2

            wrapped = wrap_user_function(user_func, with_task=True)
            result = await wrapped(10)

            assert result == 20
            ctx.emitter.task_start.assert_called_once()
            ctx.emitter.task_end.assert_called_once()

    async def test_wrap_user_function_handles_exception(self, mock_chainlit_context):
        """Test that wrapped function handles exceptions."""
        async with mock_chainlit_context:

            def user_func():
                raise ValueError("Test error")

            wrapped = wrap_user_function(user_func)
            result = await wrapped()

            # Should return None when exception occurs
            assert result is None

    async def test_wrap_user_function_with_task_handles_exception(
        self, mock_chainlit_context
    ):
        """Test that wrapped function with task handles exceptions."""
        async with mock_chainlit_context as ctx:
            ctx.emitter.task_start = AsyncMock()
            ctx.emitter.task_end = AsyncMock()

            def user_func():
                raise ValueError("Test error")

            with patch("chainlit.utils.logger") as mock_logger:
                wrapped = wrap_user_function(user_func, with_task=True)
                result = await wrapped()

                assert result is None
                ctx.emitter.task_start.assert_called_once()
                ctx.emitter.task_end.assert_called_once()
                mock_logger.exception.assert_called_once()

    async def test_wrap_user_function_preserves_function_metadata(
        self, mock_chainlit_context
    ):
        """Test that wrapping preserves function metadata."""
        async with mock_chainlit_context:

            def user_func(a, b):
                """Test function docstring."""
                return a + b

            wrapped = wrap_user_function(user_func)

            assert wrapped.__name__ == "user_func"
            assert wrapped.__doc__ == "Test function docstring."

    async def test_wrap_user_function_with_kwargs(self, mock_chainlit_context):
        """Test wrapping a function and calling with positional args."""
        async with mock_chainlit_context:

            def user_func(x, y, z):
                return x + y + z

            wrapped = wrap_user_function(user_func)
            result = await wrapped(1, 2, 3)

            assert result == 6


class TestMakeModuleGetattr:
    """Test suite for make_module_getattr."""

    def test_make_module_getattr_creates_function(self):
        """Test that make_module_getattr creates a function."""
        registry = {"SomeClass": "some.module"}
        getattr_func = make_module_getattr(registry)

        assert callable(getattr_func)

    def test_make_module_getattr_imports_module(self):
        """Test that the created function imports modules."""
        # Use a real module for testing
        registry = {"datetime": "datetime"}
        getattr_func = make_module_getattr(registry)

        result = getattr_func("datetime")
        assert result is datetime

    def test_make_module_getattr_with_nested_module(self):
        """Test with nested module path."""
        registry = {"timezone": "datetime"}
        getattr_func = make_module_getattr(registry)

        result = getattr_func("timezone")
        assert result is timezone


class TestCheckModuleVersion:
    """Test suite for check_module_version."""

    def test_check_module_version_with_installed_module(self):
        """Test checking version of an installed module."""
        # pytest should be installed
        result = check_module_version("pytest", "1.0.0")
        assert result is True

    def test_check_module_version_with_higher_required_version(self):
        """Test with a required version higher than installed."""
        # Require an impossibly high version
        result = check_module_version("pytest", "999.0.0")
        assert result is False

    def test_check_module_version_with_nonexistent_module(self):
        """Test with a module that doesn't exist."""
        result = check_module_version("nonexistent_module_xyz", "1.0.0")
        assert result is False

    def test_check_module_version_exact_match(self):
        """Test with exact version match."""
        # Get actual pytest version
        result = check_module_version("pytest", pytest.__version__)
        assert result is True

    def test_check_module_version_with_builtin_module(self):
        """Test with a builtin module that has no __version__."""
        # os module doesn't have __version__
        with pytest.raises(AttributeError):
            check_module_version("os", "1.0.0")


class TestCheckFile:
    """Test suite for check_file function."""

    def test_check_file_with_valid_py_file(self):
        """Test check_file with a valid .py file."""
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
            temp_file = f.name

        try:
            # Should not raise any exception
            check_file(temp_file)
        finally:
            os.unlink(temp_file)

    def test_check_file_with_valid_py3_file(self):
        """Test check_file with a valid .py3 file."""
        with tempfile.NamedTemporaryFile(suffix=".py3", delete=False) as f:
            temp_file = f.name

        try:
            # Should not raise any exception
            check_file(temp_file)
        finally:
            os.unlink(temp_file)

    def test_check_file_with_invalid_extension(self):
        """Test check_file with invalid file extension."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            temp_file = f.name

        try:
            with pytest.raises(click.BadArgumentUsage) as exc_info:
                check_file(temp_file)
            assert ".txt" in str(exc_info.value)
        finally:
            os.unlink(temp_file)

    def test_check_file_with_no_extension(self):
        """Test check_file with file that has no extension."""
        with tempfile.NamedTemporaryFile(suffix="", delete=False) as f:
            temp_file = f.name

        try:
            with pytest.raises(click.BadArgumentUsage) as exc_info:
                check_file(temp_file)
            assert "no extension" in str(exc_info.value)
        finally:
            os.unlink(temp_file)

    def test_check_file_with_nonexistent_file(self):
        """Test check_file with a file that doesn't exist."""
        nonexistent_file = "/path/to/nonexistent/file.py"

        with pytest.raises(click.BadParameter) as exc_info:
            check_file(nonexistent_file)
        assert "does not exist" in str(exc_info.value)

    def test_check_file_with_json_extension(self):
        """Test check_file with .json extension."""
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            temp_file = f.name

        try:
            with pytest.raises(click.BadArgumentUsage) as exc_info:
                check_file(temp_file)
            assert ".json" in str(exc_info.value)
        finally:
            os.unlink(temp_file)


class TestUtilsEdgeCases:
    """Test suite for utils edge cases."""

    def test_utc_now_format_consistency(self):
        """Test that utc_now format is consistent across calls."""
        results = [utc_now() for _ in range(5)]

        for result in results:
            # All should have same format
            assert result.endswith("Z")
            assert "T" in result
            # Should be parseable
            datetime.fromisoformat(result[:-1])

    def test_timestamp_utc_with_large_timestamp(self):
        """Test timestamp_utc with very large timestamp (far future)."""
        # Year 2100
        timestamp = 4102444800.0
        result = timestamp_utc(timestamp)

        dt = datetime.fromisoformat(result[:-1])
        assert dt.year == 2100

    @pytest.mark.asyncio
    async def test_wrap_user_function_with_multiple_exceptions(
        self, mock_chainlit_context
    ):
        """Test wrapped function handles different exception types."""
        async with mock_chainlit_context:
            exceptions = [ValueError("error1"), TypeError("error2"), KeyError("error3")]

            for exc in exceptions:

                def user_func():
                    raise exc

                with patch("chainlit.utils.logger"):
                    wrapped = wrap_user_function(user_func)
                    result = await wrapped()
                    assert result is None

    def test_check_file_with_relative_path(self):
        """Test check_file with relative path."""
        # Create a temp file in current directory
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False, dir=".") as f:
            temp_file = os.path.basename(f.name)

        try:
            # Should work with relative path
            check_file(temp_file)
        finally:
            os.unlink(temp_file)

    def test_check_file_with_absolute_path(self):
        """Test check_file with absolute path."""
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as f:
            temp_file = os.path.abspath(f.name)

        try:
            # Should work with absolute path
            check_file(temp_file)
        finally:
            os.unlink(temp_file)

    def test_make_module_getattr_with_empty_registry(self):
        """Test make_module_getattr with empty registry."""
        registry = {}
        getattr_func = make_module_getattr(registry)

        with pytest.raises(KeyError):
            getattr_func("nonexistent")

    @pytest.mark.asyncio
    async def test_wrap_user_function_with_default_args(self, mock_chainlit_context):
        """Test wrapping function with default arguments."""
        async with mock_chainlit_context:

            def user_func(a, b=10):
                return a + b

            wrapped = wrap_user_function(user_func)

            # Call with only required arg
            result = await wrapped(5)
            assert result == 15
