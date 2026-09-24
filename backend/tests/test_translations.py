import json
from io import BytesIO, StringIO, TextIOWrapper
from pathlib import Path
from unittest.mock import patch

import pytest

from chainlit.translations import compare_json_structures, lint_translation_json

# The real, shipped locale files, resolved from the repo source tree (not the
# consuming app's ``.chainlit/`` copy that ``chainlit lint-translations`` reads).
TRANSLATIONS_DIR = Path(__file__).resolve().parents[1] / "chainlit" / "translations"
GROUND_TRUTH_LOCALE = "en-US.json"


def _translation_files():
    """Every shipped locale file except the ground truth, sorted for stable ids."""
    return sorted(
        p.name for p in TRANSLATIONS_DIR.glob("*.json") if p.name != GROUND_TRUTH_LOCALE
    )


def _all_locale_files():
    """Every shipped locale file, including the ground truth, sorted for stable ids."""
    return sorted(p.name for p in TRANSLATIONS_DIR.glob("*.json"))


def _string_leaves(data, path=""):
    """Yield ``(dotted_path, value)`` for every string leaf in a nested dict."""
    if isinstance(data, dict):
        for key, value in data.items():
            yield from _string_leaves(value, f"{path}.{key}" if path else key)
    elif isinstance(data, str):
        yield path, data


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

    @staticmethod
    def _cp1252_stdout():
        raw = BytesIO()
        stream = TextIOWrapper(raw, encoding="cp1252")
        return raw, stream

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

    def test_lint_with_errors_on_legacy_stdout_encoding(self):
        """Test linting degrades markers when stdout cannot encode them."""
        truth = {"key1": "value1"}
        to_compare = {"key2": "value2"}
        raw, stream = self._cp1252_stdout()

        with patch("sys.stdout", new=stream):
            lint_translation_json("test.json", truth, to_compare)
            stream.flush()

        output = raw.getvalue().decode("cp1252")

        assert "Linting test.json..." in output
        assert "Missing key: 'key1'" in output
        assert "Extra key: 'key2'" in output

    def test_lint_success_on_legacy_stdout_encoding(self):
        """Test success output does not crash on legacy stdout encodings."""
        truth = {"key1": "value1"}
        to_compare = {"key1": "value1"}
        raw, stream = self._cp1252_stdout()

        with patch("sys.stdout", new=stream):
            lint_translation_json("test.json", truth, to_compare)
            stream.flush()

        output = raw.getvalue().decode("cp1252")

        assert "Linting test.json..." in output
        assert "No errors found in test.json" in output


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


class TestTranslationFilesParity:
    """Parity guard for the real locale files in ``backend/chainlit/translations``.

    The suite above validates ``compare_json_structures`` against synthetic
    dictionaries. These tests instead load the actual shipped locale files and
    assert every one carries the full key structure of the ground-truth
    ``en-US.json``. A PR that adds a key to ``en-US.json`` and forgets the other
    locales fails here, in CI, instead of silently shipping a missing-key render.
    See https://github.com/Chainlit/chainlit/issues/2993.
    """

    def test_ground_truth_locale_exists(self):
        assert (TRANSLATIONS_DIR / GROUND_TRUTH_LOCALE).is_file(), (
            f"Ground-truth locale {GROUND_TRUTH_LOCALE} not found in {TRANSLATIONS_DIR}"
        )

    def test_translation_files_are_discovered(self):
        # Guard against discovery finding nothing (e.g. if the directory ever
        # moves): otherwise the parametrized parity test would pass vacuously.
        assert _translation_files(), f"No locale files discovered in {TRANSLATIONS_DIR}"

    @pytest.mark.parametrize("locale_file", _translation_files())
    def test_locale_matches_ground_truth(self, locale_file):
        truth = json.loads(
            (TRANSLATIONS_DIR / GROUND_TRUTH_LOCALE).read_text(encoding="utf-8")
        )
        translation = json.loads(
            (TRANSLATIONS_DIR / locale_file).read_text(encoding="utf-8")
        )
        errors = compare_json_structures(truth, translation)
        assert not errors, (
            f"{locale_file} is out of sync with {GROUND_TRUTH_LOCALE}:\n"
            + "\n".join(errors)
        )

    @pytest.mark.parametrize("locale_file", _all_locale_files())
    def test_locale_has_no_empty_strings(self, locale_file):
        # compare_json_structures only checks key structure, not leaf values, so a
        # key whose value is an empty string would pass the parity test above yet
        # still render blank -- the exact symptom this guards against. Assert every
        # string leaf carries actual text.
        data = json.loads((TRANSLATIONS_DIR / locale_file).read_text(encoding="utf-8"))
        empty = [path for path, value in _string_leaves(data) if not value.strip()]
        assert not empty, (
            f"{locale_file} has empty translation values (they render blank):\n"
            + "\n".join(empty)
        )
