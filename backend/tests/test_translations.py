from io import StringIO
from unittest.mock import patch

import pytest

from chainlit.translations import compare_json_structures, lint_translation_json


class TestCompareJsonStructures:
    """Test suite for compare_json_structures function."""

    def test_compare_identical_structures(self):
        """Test comparing identical JSON structures."""
        truth = {"key1": "value1", "key2": "value2"}
        to_compare = {"key1": "value1", "key2": "value2"}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_compare_with_missing_keys(self):
        """Test when to_compare is missing keys."""
        truth = {"key1": "value1", "key2": "value2", "key3": "value3"}
        to_compare = {"key1": "value1"}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 2
        assert "❌ Missing key: 'key2'" in errors
        assert "❌ Missing key: 'key3'" in errors

    def test_compare_with_extra_keys(self):
        """Test when to_compare has extra keys."""
        truth = {"key1": "value1"}
        to_compare = {"key1": "value1", "key2": "value2", "key3": "value3"}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 2
        assert "⚠️ Extra key: 'key2'" in errors
        assert "⚠️ Extra key: 'key3'" in errors

    def test_compare_with_both_missing_and_extra_keys(self):
        """Test when there are both missing and extra keys."""
        truth = {"key1": "value1", "key2": "value2"}
        to_compare = {"key1": "value1", "key3": "value3"}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 2
        assert any("Extra key: 'key3'" in e for e in errors)
        assert any("Missing key: 'key2'" in e for e in errors)

    def test_compare_nested_structures(self):
        """Test comparing nested JSON structures."""
        truth = {"level1": {"level2": {"key": "value"}}}
        to_compare = {"level1": {"level2": {"key": "value"}}}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_compare_nested_with_missing_keys(self):
        """Test nested structures with missing keys."""
        truth = {"level1": {"key1": "value1", "key2": "value2"}}
        to_compare = {"level1": {"key1": "value1"}}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 1
        assert "❌ Missing key: 'level1.key2'" in errors

    def test_compare_nested_with_extra_keys(self):
        """Test nested structures with extra keys."""
        truth = {"level1": {"key1": "value1"}}
        to_compare = {"level1": {"key1": "value1", "key2": "value2"}}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 1
        assert "⚠️ Extra key: 'level1.key2'" in errors

    def test_compare_deeply_nested_structures(self):
        """Test deeply nested structures."""
        truth = {"a": {"b": {"c": {"d": "value"}}}}
        to_compare = {"a": {"b": {"c": {}}}}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 1
        assert "❌ Missing key: 'a.b.c.d'" in errors

    def test_compare_structure_mismatch_dict_vs_value(self):
        """Test when one is dict and other is value."""
        truth = {"key": {"nested": "value"}}
        to_compare = {"key": "not_a_dict"}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 1
        assert "❌ Structure mismatch at: 'key'" in errors

    def test_compare_structure_mismatch_value_vs_dict(self):
        """Test when truth is value and to_compare is dict."""
        truth = {"key": "value"}
        to_compare = {"key": {"nested": "value"}}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 1
        assert "❌ Structure mismatch at: 'key'" in errors

    def test_compare_with_non_dict_input_truth(self):
        """Test error when truth is not a dict."""
        with pytest.raises(ValueError, match="Both inputs must be dictionaries"):
            compare_json_structures("not_a_dict", {})

    def test_compare_with_non_dict_input_to_compare(self):
        """Test error when to_compare is not a dict."""
        with pytest.raises(ValueError, match="Both inputs must be dictionaries"):
            compare_json_structures({}, "not_a_dict")

    def test_compare_with_both_non_dict_inputs(self):
        """Test error when both inputs are not dicts."""
        with pytest.raises(ValueError, match="Both inputs must be dictionaries"):
            compare_json_structures("not_a_dict", "also_not_a_dict")

    def test_compare_empty_dicts(self):
        """Test comparing empty dictionaries."""
        truth = {}
        to_compare = {}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_compare_empty_truth_with_data(self):
        """Test when truth is empty but to_compare has data."""
        truth = {}
        to_compare = {"key1": "value1", "key2": "value2"}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 2
        assert all("Extra key" in e for e in errors)

    def test_compare_empty_to_compare_with_data(self):
        """Test when to_compare is empty but truth has data."""
        truth = {"key1": "value1", "key2": "value2"}
        to_compare = {}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 2
        assert all("Missing key" in e for e in errors)

    def test_compare_with_different_value_types(self):
        """Test that different value types at leaf nodes don't cause errors."""
        truth = {"key1": "string", "key2": 123, "key3": True}
        to_compare = {"key1": "different", "key2": 456, "key3": False}

        errors = compare_json_structures(truth, to_compare)

        # Structure matches, so no errors (values are not compared)
        assert errors == []

    def test_compare_complex_nested_structure(self):
        """Test complex nested structure with multiple levels."""
        truth = {
            "app": {
                "title": "My App",
                "settings": {"theme": "dark", "language": "en"},
            },
            "user": {"name": "John", "preferences": {"notifications": True}},
        }
        to_compare = {
            "app": {
                "title": "My App",
                "settings": {"theme": "light"},  # Missing 'language'
            },
            "user": {
                "name": "Jane",
                "preferences": {"notifications": False, "extra": "value"},  # Extra key
            },
        }

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 2
        assert any("Missing key: 'app.settings.language'" in e for e in errors)
        assert any("Extra key: 'user.preferences.extra'" in e for e in errors)

    def test_compare_with_null_values(self):
        """Test structures with None/null values."""
        truth = {"key1": None, "key2": "value"}
        to_compare = {"key1": None, "key2": "value"}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_compare_with_list_values(self):
        """Test structures with list values (treated as leaf nodes)."""
        truth = {"key1": ["a", "b", "c"], "key2": "value"}
        to_compare = {"key1": ["x", "y"], "key2": "value"}

        errors = compare_json_structures(truth, to_compare)

        # Lists are leaf nodes, structure matches
        assert errors == []

    def test_compare_path_formatting(self):
        """Test that error paths are formatted correctly."""
        truth = {"a": {"b": {"c": "value"}}}
        to_compare = {"a": {"b": {}}}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 1
        assert "a.b.c" in errors[0]
        assert not errors[0].startswith(".")


class TestLintTranslationJson:
    """Test suite for lint_translation_json function."""

    def test_lint_with_no_errors(self):
        """Test linting when there are no errors."""
        truth = {"key1": "value1", "key2": "value2"}
        to_compare = {"key1": "value1", "key2": "value2"}

        with patch("sys.stdout", new=StringIO()) as fake_out:
            lint_translation_json("test.json", truth, to_compare)
            output = fake_out.getvalue()

            assert "Linting test.json..." in output
            assert "✅ No errors found in test.json" in output

    def test_lint_with_errors(self):
        """Test linting when there are errors."""
        truth = {"key1": "value1", "key2": "value2"}
        to_compare = {"key1": "value1", "key3": "value3"}

        with patch("sys.stdout", new=StringIO()) as fake_out:
            lint_translation_json("test.json", truth, to_compare)
            output = fake_out.getvalue()

            assert "Linting test.json..." in output
            assert "Missing key: 'key2'" in output
            assert "Extra key: 'key3'" in output
            assert "✅ No errors found" not in output

    def test_lint_with_nested_errors(self):
        """Test linting with nested structure errors."""
        truth = {"level1": {"key1": "value1", "key2": "value2"}}
        to_compare = {"level1": {"key1": "value1"}}

        with patch("sys.stdout", new=StringIO()) as fake_out:
            lint_translation_json("nested.json", truth, to_compare)
            output = fake_out.getvalue()

            assert "Linting nested.json..." in output
            assert "Missing key: 'level1.key2'" in output

    def test_lint_with_structure_mismatch(self):
        """Test linting with structure mismatch."""
        truth = {"key": {"nested": "value"}}
        to_compare = {"key": "not_nested"}

        with patch("sys.stdout", new=StringIO()) as fake_out:
            lint_translation_json("mismatch.json", truth, to_compare)
            output = fake_out.getvalue()

            assert "Linting mismatch.json..." in output
            assert "Structure mismatch at: 'key'" in output

    def test_lint_with_multiple_errors(self):
        """Test linting with multiple types of errors."""
        truth = {
            "key1": "value1",
            "key2": {"nested": "value"},
            "key3": "value3",
        }
        to_compare = {
            "key1": "value1",
            "key2": "not_nested",
            "key4": "extra",
        }

        with patch("sys.stdout", new=StringIO()) as fake_out:
            lint_translation_json("multi.json", truth, to_compare)
            output = fake_out.getvalue()

            assert "Linting multi.json..." in output
            assert "Structure mismatch" in output
            assert "Missing key: 'key3'" in output
            assert "Extra key: 'key4'" in output

    def test_lint_output_format(self):
        """Test that lint output is properly formatted."""
        truth = {"key1": "value1"}
        to_compare = {"key2": "value2"}

        with patch("sys.stdout", new=StringIO()) as fake_out:
            lint_translation_json("format.json", truth, to_compare)
            output = fake_out.getvalue()

            # Check that output starts with newline and linting message
            lines = output.strip().split("\n")
            assert "Linting format.json..." in lines[0]
            assert len(lines) >= 2  # At least linting message + errors


class TestTranslationsEdgeCases:
    """Test suite for edge cases in translations module."""

    def test_compare_with_numeric_keys(self):
        """Test structures with numeric keys (as strings)."""
        truth = {"1": "value1", "2": "value2"}
        to_compare = {"1": "value1", "2": "value2"}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_compare_with_special_characters_in_keys(self):
        """Test keys with special characters."""
        truth = {"key-1": "value", "key_2": "value", "key.3": "value"}
        to_compare = {"key-1": "value", "key_2": "value", "key.3": "value"}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_compare_with_unicode_keys(self):
        """Test keys with unicode characters."""
        truth = {"键": "value", "clé": "value", "مفتاح": "value"}
        to_compare = {"键": "value", "clé": "value", "مفتاح": "value"}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_compare_very_deeply_nested(self):
        """Test very deeply nested structures."""
        truth = {"a": {"b": {"c": {"d": {"e": {"f": "value"}}}}}}
        to_compare = {"a": {"b": {"c": {"d": {"e": {}}}}}}

        errors = compare_json_structures(truth, to_compare)

        assert len(errors) == 1
        assert "a.b.c.d.e.f" in errors[0]

    def test_compare_with_empty_string_values(self):
        """Test structures with empty string values."""
        truth = {"key1": "", "key2": "value"}
        to_compare = {"key1": "", "key2": "value"}

        errors = compare_json_structures(truth, to_compare)

        assert errors == []

    def test_lint_with_empty_filename(self):
        """Test lint with empty filename."""
        truth = {"key": "value"}
        to_compare = {"key": "value"}

        with patch("sys.stdout", new=StringIO()) as fake_out:
            lint_translation_json("", truth, to_compare)
            output = fake_out.getvalue()

            assert "Linting ..." in output

    def test_compare_preserves_error_order(self):
        """Test that errors are reported in a consistent order."""
        truth = {"a": "1", "b": "2", "c": "3"}
        to_compare = {"d": "4", "e": "5"}

        errors = compare_json_structures(truth, to_compare)

        # Should have 2 extra keys and 3 missing keys
        assert len(errors) == 5
        extra_errors = [e for e in errors if "Extra" in e]
        missing_errors = [e for e in errors if "Missing" in e]
        assert len(extra_errors) == 2
        assert len(missing_errors) == 3
