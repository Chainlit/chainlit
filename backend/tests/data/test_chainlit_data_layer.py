from datetime import datetime

import pytest

from chainlit.data.chainlit_data_layer import (
    ChainlitDataLayer,
    _datetime_to_utc_iso,
    _parse_iso_datetime,
)


class TestParseIsoDatetime:
    """Test suite for _parse_iso_datetime helper."""

    def test_parse_with_z_suffix(self):
        """Test parsing ISO datetime string with trailing Z."""
        result = _parse_iso_datetime("2025-09-04T02:00:42.164000Z")
        assert result == datetime(2025, 9, 4, 2, 0, 42, 164000)

    def test_parse_without_z_suffix(self):
        """Test parsing ISO datetime string without trailing Z (the bug case)."""
        result = _parse_iso_datetime("2025-09-04T02:00:42.164000")
        assert result == datetime(2025, 9, 4, 2, 0, 42, 164000)

    def test_parse_without_z_raises_on_bad_format(self):
        """Test that invalid format still raises ValueError."""
        # noqa: PT011 - _parse_iso_datetime forwards ValueError from datetime.strptime.
        with pytest.raises(ValueError):
            _parse_iso_datetime("2025-09-04 02:00:42")

    def test_roundtrip_with_z(self):
        """Test that parsing a Z-suffixed string and formatting round-trips."""
        original = "2025-09-04T02:00:42.164000Z"
        dt = _parse_iso_datetime(original)
        formatted = _datetime_to_utc_iso(dt)
        assert formatted == original

    def test_roundtrip_without_z(self):
        """Test that parsing a non-Z string and formatting produces Z-suffixed output."""
        original = "2025-09-04T02:00:42.164000"
        dt = _parse_iso_datetime(original)
        formatted = _datetime_to_utc_iso(dt)
        assert formatted == original + "Z"


class TestDatetimeToUtcIso:
    """Test suite for _datetime_to_utc_iso helper."""

    def test_adds_z_suffix(self):
        """Test that Z is always appended."""
        dt = datetime(2025, 9, 4, 2, 0, 42, 164000)
        result = _datetime_to_utc_iso(dt)
        assert result == "2025-09-04T02:00:42.164000Z"

    def test_no_double_z(self):
        """Test that Z is not duplicated."""
        dt = datetime(2025, 1, 1, 0, 0, 0, 0)
        result = _datetime_to_utc_iso(dt)
        assert not result.endswith("ZZ")
        assert result.endswith("Z")

    def test_zero_microseconds(self):
        """Test formatting with zero microseconds."""
        dt = datetime(2025, 1, 1, 12, 30, 45)
        result = _datetime_to_utc_iso(dt)
        assert result == "2025-01-01T12:30:45Z"
        assert result.endswith("Z")


class TestConvertStepRowTimestamps:
    """Test that _convert_step_row_to_dict produces timestamps with trailing Z."""

    def _make_layer(self):
        return ChainlitDataLayer(database_url="postgresql://fake", storage_client=None)

    def _make_step_row(self, **overrides):
        row = {
            "id": "step-1",
            "threadId": "thread-1",
            "parentId": None,
            "name": "test_step",
            "type": "run",
            "input": "{}",
            "output": "{}",
            "metadata": "{}",
            "createdAt": datetime(2025, 9, 4, 2, 0, 42, 164000),
            "startTime": datetime(2025, 9, 4, 2, 0, 42, 164000),
            "endTime": datetime(2025, 9, 4, 2, 0, 43, 0),
            "showInput": "json",
            "isError": False,
            "feedback_id": None,
        }
        row.update(overrides)
        return row

    def test_step_timestamps_have_z_suffix(self):
        """Test that step createdAt, start, end all end with Z."""
        layer = self._make_layer()
        row = self._make_step_row()

        result = layer._convert_step_row_to_dict(row)

        assert result["createdAt"].endswith("Z"), (
            f"createdAt should end with Z, got: {result['createdAt']}"
        )
        assert result["start"].endswith("Z"), (
            f"start should end with Z, got: {result['start']}"
        )
        assert result["end"].endswith("Z"), (
            f"end should end with Z, got: {result['end']}"
        )

    def test_step_timestamps_can_be_reparsed(self):
        """Test that timestamps from _convert_step_row_to_dict can be parsed back.

        This is the exact scenario from bug #2491: after reading a step from DB,
        the createdAt string should be parseable when passed back to
        create_step/update_step.
        """
        layer = self._make_layer()
        row = self._make_step_row()

        result = layer._convert_step_row_to_dict(row)

        # Simulate what create_step does when update_step feeds back the step dict
        parsed = _parse_iso_datetime(result["createdAt"])
        assert parsed == datetime(2025, 9, 4, 2, 0, 42, 164000)

    def test_step_none_timestamps_preserved(self):
        """Test that None timestamps are preserved as None."""
        layer = self._make_layer()
        row = self._make_step_row(createdAt=None, startTime=None, endTime=None)

        result = layer._convert_step_row_to_dict(row)

        assert result["createdAt"] is None
        assert result["start"] is None
        assert result["end"] is None
