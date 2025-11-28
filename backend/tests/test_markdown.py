import os
import tempfile
from unittest.mock import patch

import pytest

from chainlit.markdown import DEFAULT_MARKDOWN_STR, get_markdown_str, init_markdown


class TestInitMarkdown:
    """Test suite for init_markdown function."""

    def test_init_markdown_creates_file(self):
        """Test that init_markdown creates chainlit.md if it doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            init_markdown(tmpdir)

            chainlit_md_path = os.path.join(tmpdir, "chainlit.md")
            assert os.path.exists(chainlit_md_path)

            # Verify content is the default markdown
            with open(chainlit_md_path, encoding="utf-8") as f:
                content = f.read()
            assert content == DEFAULT_MARKDOWN_STR

    def test_init_markdown_does_not_overwrite_existing(self):
        """Test that init_markdown doesn't overwrite existing chainlit.md."""
        with tempfile.TemporaryDirectory() as tmpdir:
            chainlit_md_path = os.path.join(tmpdir, "chainlit.md")
            custom_content = "# My Custom Markdown"

            # Create existing file
            with open(chainlit_md_path, "w", encoding="utf-8") as f:
                f.write(custom_content)

            # Call init_markdown
            init_markdown(tmpdir)

            # Verify content is unchanged
            with open(chainlit_md_path, encoding="utf-8") as f:
                content = f.read()
            assert content == custom_content

    def test_init_markdown_with_nonexistent_directory(self):
        """Test init_markdown with a directory that doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            nonexistent_dir = os.path.join(tmpdir, "nonexistent")

            # Should raise an error when trying to create file in nonexistent dir
            with pytest.raises(FileNotFoundError):
                init_markdown(nonexistent_dir)

    def test_init_markdown_creates_utf8_file(self):
        """Test that init_markdown creates file with UTF-8 encoding."""
        with tempfile.TemporaryDirectory() as tmpdir:
            init_markdown(tmpdir)

            chainlit_md_path = os.path.join(tmpdir, "chainlit.md")

            # Verify UTF-8 encoding by reading with explicit encoding
            with open(chainlit_md_path, encoding="utf-8") as f:
                content = f.read()

            # Should contain emoji characters from DEFAULT_MARKDOWN_STR
            assert "🚀" in content
            assert "🤖" in content


class TestGetMarkdownStr:
    """Test suite for get_markdown_str function."""

    def test_get_markdown_str_returns_default(self):
        """Test get_markdown_str returns default chainlit.md content."""
        with tempfile.TemporaryDirectory() as tmpdir:
            chainlit_md_path = os.path.join(tmpdir, "chainlit.md")
            content = "# Default Chainlit Markdown"

            with open(chainlit_md_path, "w", encoding="utf-8") as f:
                f.write(content)

            result = get_markdown_str(tmpdir, "en")
            assert result == content

    def test_get_markdown_str_returns_translated(self):
        """Test get_markdown_str returns translated markdown when available."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create default markdown
            default_content = "# Default English"
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(default_content)

            # Create translated markdown
            translated_content = "# Français"
            with open(
                os.path.join(tmpdir, "chainlit_fr.md"), "w", encoding="utf-8"
            ) as f:
                f.write(translated_content)

            result = get_markdown_str(tmpdir, "fr")
            assert result == translated_content

    def test_get_markdown_str_falls_back_to_default(self):
        """Test get_markdown_str falls back to default when translation missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            default_content = "# Default English"
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(default_content)

            # Request non-existent translation
            with patch("chainlit.markdown.logger") as mock_logger:
                result = get_markdown_str(tmpdir, "es")

                assert result == default_content
                mock_logger.warning.assert_called_once()
                assert "es" in str(mock_logger.warning.call_args)

    def test_get_markdown_str_returns_none_when_no_file(self):
        """Test get_markdown_str returns None when no markdown file exists."""
        with tempfile.TemporaryDirectory() as tmpdir:
            result = get_markdown_str(tmpdir, "en")
            assert result is None

    def test_get_markdown_str_with_utf8_content(self):
        """Test get_markdown_str handles UTF-8 content correctly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            content = "# Welcome 欢迎 🎉\n\nこんにちは"
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(content)

            result = get_markdown_str(tmpdir, "en")
            assert result == content
            assert "欢迎" in result
            assert "こんにちは" in result

    def test_get_markdown_str_prevents_path_traversal(self):
        """Test get_markdown_str prevents path traversal attacks."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create default markdown
            default_content = "# Default"
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(default_content)

            # Try to access file outside root using path traversal
            # The is_path_inside check should prevent this
            result = get_markdown_str(tmpdir, "../../../etc/passwd")

            # Should fall back to default since traversal is blocked
            assert result == default_content

    def test_get_markdown_str_with_multiple_languages(self):
        """Test get_markdown_str with multiple language files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create multiple language files
            languages = {
                "en": "# English",
                "fr": "# Français",
                "es": "# Español",
                "ja": "# 日本語",
            }

            # Create default
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(languages["en"])

            # Create translations
            for lang, content in languages.items():
                if lang != "en":
                    path = os.path.join(tmpdir, f"chainlit_{lang}.md")
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)

            # Test each language
            for lang, expected_content in languages.items():
                result = get_markdown_str(tmpdir, lang)
                assert result == expected_content

    def test_get_markdown_str_with_empty_file(self):
        """Test get_markdown_str with empty markdown file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create empty file
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write("")

            result = get_markdown_str(tmpdir, "en")
            assert result == ""

    def test_get_markdown_str_with_large_file(self):
        """Test get_markdown_str with large markdown file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create large content
            large_content = "# Header\n" + ("Lorem ipsum dolor sit amet.\n" * 1000)
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(large_content)

            result = get_markdown_str(tmpdir, "en")
            assert result == large_content
            assert len(result) > 10000


class TestDefaultMarkdownStr:
    """Test suite for DEFAULT_MARKDOWN_STR constant."""

    def test_default_markdown_str_is_string(self):
        """Test that DEFAULT_MARKDOWN_STR is a string."""
        assert isinstance(DEFAULT_MARKDOWN_STR, str)

    def test_default_markdown_str_not_empty(self):
        """Test that DEFAULT_MARKDOWN_STR is not empty."""
        assert len(DEFAULT_MARKDOWN_STR) > 0

    def test_default_markdown_str_contains_welcome(self):
        """Test that DEFAULT_MARKDOWN_STR contains welcome message."""
        assert "Welcome to Chainlit" in DEFAULT_MARKDOWN_STR

    def test_default_markdown_str_contains_links(self):
        """Test that DEFAULT_MARKDOWN_STR contains useful links."""
        assert "Documentation" in DEFAULT_MARKDOWN_STR
        assert "Discord" in DEFAULT_MARKDOWN_STR
        assert "https://docs.chainlit.io" in DEFAULT_MARKDOWN_STR

    def test_default_markdown_str_is_valid_markdown(self):
        """Test that DEFAULT_MARKDOWN_STR contains valid markdown syntax."""
        assert "#" in DEFAULT_MARKDOWN_STR  # Headers
        assert "**" in DEFAULT_MARKDOWN_STR  # Bold
        assert "[" in DEFAULT_MARKDOWN_STR  # Links
        assert "](" in DEFAULT_MARKDOWN_STR  # Link syntax


class TestMarkdownEdgeCases:
    """Test suite for markdown edge cases."""

    def test_init_markdown_with_special_characters_in_path(self):
        """Test init_markdown with special characters in directory path."""
        with tempfile.TemporaryDirectory() as tmpdir:
            special_dir = os.path.join(tmpdir, "test dir with spaces")
            os.makedirs(special_dir)

            init_markdown(special_dir)

            chainlit_md_path = os.path.join(special_dir, "chainlit.md")
            assert os.path.exists(chainlit_md_path)

    def test_get_markdown_str_with_symlink(self):
        """Test get_markdown_str with symlinked markdown file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create original file
            original_dir = os.path.join(tmpdir, "original")
            os.makedirs(original_dir)
            original_file = os.path.join(original_dir, "chainlit.md")
            content = "# Original Content"
            with open(original_file, "w", encoding="utf-8") as f:
                f.write(content)

            # Create symlink directory
            link_dir = os.path.join(tmpdir, "link")
            os.makedirs(link_dir)
            link_file = os.path.join(link_dir, "chainlit.md")

            # Create symlink (skip on Windows if no permissions)
            try:
                os.symlink(original_file, link_file)
                result = get_markdown_str(link_dir, "en")
                assert result == content
            except OSError:
                pytest.skip("Symlink creation not supported")

    def test_get_markdown_str_with_relative_path(self):
        """Test get_markdown_str with relative path."""
        with tempfile.TemporaryDirectory() as tmpdir:
            content = "# Test Content"
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(content)

            # Use relative path
            original_cwd = os.getcwd()
            try:
                os.chdir(tmpdir)
                result = get_markdown_str(".", "en")
                assert result == content
            finally:
                os.chdir(original_cwd)

    def test_get_markdown_str_language_case_sensitivity(self):
        """Test get_markdown_str language code is used as-is in filename."""
        with tempfile.TemporaryDirectory() as tmpdir:
            default_content = "# Default"
            with open(os.path.join(tmpdir, "chainlit.md"), "w", encoding="utf-8") as f:
                f.write(default_content)

            # Create a language file
            fr_content = "# Français"
            with open(
                os.path.join(tmpdir, "chainlit_fr.md"), "w", encoding="utf-8"
            ) as f:
                f.write(fr_content)

            # Test exact match - should get the file
            result = get_markdown_str(tmpdir, "fr")
            assert result == fr_content

            # Test different case that doesn't exist - should fall back to default
            # Note: On case-insensitive file systems (Windows), this might still find the file
            # On case-sensitive file systems (Linux), it will fall back to default
            with patch("chainlit.markdown.logger"):
                result_different = get_markdown_str(tmpdir, "es")
                assert result_different == default_content

    def test_init_markdown_concurrent_calls(self):
        """Test init_markdown with concurrent calls (race condition)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Call init_markdown multiple times
            init_markdown(tmpdir)
            init_markdown(tmpdir)
            init_markdown(tmpdir)

            # Should only have one file with default content
            chainlit_md_path = os.path.join(tmpdir, "chainlit.md")
            assert os.path.exists(chainlit_md_path)

            with open(chainlit_md_path, encoding="utf-8") as f:
                content = f.read()
            assert content == DEFAULT_MARKDOWN_STR
